import frappe
import json
from frappe.model.workflow import apply_workflow

@frappe.whitelist()
def create_order(table, customer=None, items=None):
    """
    Create a Restaurant Order for a table.
    Works for both walk-in and reservation guests.
    """
    if isinstance(items, str):
        items = json.loads(items)

    order = frappe.new_doc("Restaurant Order")
    order.table = table
    order.customer = customer
    order.order_type = "Dine-In"
    order.workflow_state = "Draft"

    for i in items:
        item_doc = frappe.get_doc("Item", i.get("item"))
        
        # Get default BOM if exists
        bom = frappe.db.get_value("BOM", {"item": item_doc.name, "is_active": 1, "is_default": 1})
        
        order.append("items", {
            "item": item_doc.name,
            "qty": i.get("qty", 1),
            "status": "Pending",
            "is_new_item": 1,
            "bom": bom  # save BOM link
        })
        
        # Optional: Auto-create Work Order if BOM exists
        if bom:
            # frappe.throw(bom)
            wo = frappe.new_doc("Work Order")
            wo.production_item = item_doc.name
            wo.bom_no = bom
            wo.qty = i.get("qty", 1)
            wo.company = order.company  # replace with your company
            wo.fg_warehouse = "Finished Goods - S"
            wo.wip_warehouse = "Work In Progress - S"
            wo.custom_restaurant_order = order.name
            wo.save(ignore_permissions=True)
            wo.submit()

    order.insert(ignore_permissions=True)

    # Update table
    frappe.db.set_value(
        "Restaurant Table",
        table,
        {
            "status": "Occupied",
            "current_order": order.name
        }
    )

    return order.name

@frappe.whitelist()
def get_current_order(table):
    """
    Get the current active order of a table.
    """
    table_doc = frappe.get_doc("Restaurant Table", table)
    if table_doc.get("current_order"):
        order_doc = frappe.get_doc("Restaurant Order", table_doc.current_order)
        return {
            "name": order_doc.name,
            "table": order_doc.table,
            "customer": order_doc.customer,
            "items": [{"item": d.item, "qty": d.qty} for d in order_doc.items]
        }
    return None

@frappe.whitelist()
def update_existing_order(order_name, items):
    """
    Add new items to existing order.
    """
    if isinstance(items, str):
        items = json.loads(items)

    order = frappe.get_doc("Restaurant Order", order_name)
    for i in items:
        item_doc = frappe.get_doc("Item", i.get("item"))
        
        # Get default BOM if exists
        bom = frappe.db.get_value("BOM", {"item": item_doc.name, "is_active": 1, "is_default": 1})
        
        order.append("items", {
            "item": item_doc.name,
            "qty": i.get("qty", 1),
            "status": "Pending",
            "is_new_item": 1,
            "bom": bom  # save BOM link
        })
        
        if bom:
            wo = frappe.new_doc("Work Order")
            wo.production_item = item_doc.name
            wo.bom_no = bom
            wo.qty = i.get("qty", 1)
            wo.company = order.company
            wo.fg_warehouse = "Finished Goods - S"
            wo.wip_warehouse = "Work In Progress - S"
            wo.custom_restaurant_order = order.name
            wo.save(ignore_permissions=True)
            wo.submit()

    if order.workflow_state == "Ready":
        apply_workflow(order, "Add More Items")

    order.save(ignore_permissions=True)
    return order.name
