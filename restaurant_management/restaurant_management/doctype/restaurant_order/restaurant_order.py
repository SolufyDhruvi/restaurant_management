# Copyright (c) 2025, Dhruvi Soliya and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document
from frappe.model.workflow import apply_workflow
from frappe.utils import flt, now_datetime

class RestaurantOrder(Document):
	def on_update(self):				
		if self.workflow_state == "Billed" and self.table:
			frappe.db.set_value(
				"Restaurant Table",
				self.table,
				{
					"status": "Cleaning",
					"cleaning_start_time": now_datetime(),
					"current_order": None,
					"current_reservation": None
				}
			)
			frappe.enqueue(
				method="restaurant_management.restaurant_management.customization.restaurant_table.restaurant_table.free_table_after_cleaning",
				queue="long",
				table_name=self.table,
				enqueue_after_commit=True
			)
		if (self.workflow_state == "Cooking" and self.items and all(i.status == "Ready" for i in self.items)):
			self.db_set("workflow_state", "Ready")
	
	def validate(self):
		if self.items:
			for row in self.items:
				if row.item:
					if row.rate:
						row.amount = row.qty*row.rate

	@frappe.whitelist()
	def make_sales_invoice(self):
		si = frappe.new_doc("Sales Invoice")
		si.customer = self.customer
		si.company = self.company
		si.due_date = frappe.utils.nowdate()
		si.custom_restaurant_order = self.name
		si.custom_reservation = self.current_reservation if self.current_reservation else None
		for row in self.items:
			si.append("items",{
				"item_code": row.item,
				"item_name": row.item,
				"qty": row.qty,
				"rate": row.rate,
				"amount": row.amount,
				"description": row.kitchen_note
			})
		return si.as_dict()

@frappe.whitelist()
def get_kitchen_orders():
    """
    Return all active cooking orders with only the new batch quantity
    for kitchen display. Total qty in Restaurant Order Item table remains cumulative.
    """
    orders = frappe.get_all(
        "Restaurant Order",
        filters={"workflow_state": "Cooking"},
        fields=["name", "table", "creation", "owner"]
    )

    final_orders = []

    for order in orders:
        doc = frappe.get_doc("Restaurant Order", order.name)
        items = []

        for d in doc.items:
            # Only consider new items not yet served
            if getattr(d, "is_new_item", 0) == 1:
                # last_batch_qty: how many to send to kitchen now
                last_batch = getattr(d, "last_batch_qty", d.qty)
                items.append({
                    "name": d.name,  # child row name
                    "item": d.item,
                    "item_name": frappe.db.get_value("Item", d.item, "item_name"),
                    "qty": last_batch  # send only the new batch to kitchen
                })

        if items:
            order["items"] = items
            final_orders.append(order)

    return final_orders

@frappe.whitelist()
def mark_order_ready(row_name):
    row = frappe.get_doc("Restaurant Order Item", row_name)

    row.status = "Ready"
    row.sent_qty = row.qty
    # row.last_batch_qty = 0
    row.is_new_item = 0
    row.save(ignore_permissions=True)

    order = frappe.get_doc("Restaurant Order", row.parent)
    if not any(d.is_new_item == 1 for d in order.items):
        order.workflow_state = "Ready"
        order.save(ignore_permissions=True)

    return "OK"
@frappe.whitelist()
def get_waiter_orders():
    orders = frappe.get_all(
        "Restaurant Order",
        filters={"workflow_state": ["in", ["Cooking", "Ready"]]},
        fields=["name", "table", "creation", "owner"]
    )

    final_orders = []

    for o in orders:
        doc = frappe.get_doc("Restaurant Order", o.name)
        items = []

        for d in doc.items:
            if d.status == "Ready":
                items.append({
                    "row_name": d.name,
                    "item": d.item,
                    "qty": d.last_batch_qty,
                    "item_name": frappe.db.get_value("Item", d.item, "item_name")
                })

        if items:
            o["items"] = items
            final_orders.append(o)

    return final_orders
@frappe.whitelist()
def mark_item_served(row_name):
    item = frappe.get_doc("Restaurant Order Item", row_name)
    item.status = "Served"
    item.save(ignore_permissions=True)

    parent = frappe.get_doc("Restaurant Order", item.parent)

    # Agar sab items Served ho gaye
    if all(d.status == "Served" for d in parent.items):
        parent.workflow_state = "Served"
        parent.save(ignore_permissions=True)

    return "OK"

@frappe.whitelist()
def get_table_amount(table):
    order = frappe.get_all(
        "Restaurant Order",
        filters={
            "table": table,
            "docstatus": ["!=", 2]
        },
        fields=["name"],
        limit=1
    )

    if not order:
        return 0

    order_name = order[0].name

    items = frappe.get_all(
        "Restaurant Order Item",
        filters={"parent": order_name},
        fields=["amount"]
    )

    total = sum(flt(i.amount) for i in items)
    return total


