import frappe
import json
from frappe.model.workflow import apply_workflow
from frappe.utils import now_datetime
from frappe.utils import flt
import frappe
import json
from frappe.model.workflow import apply_workflow
from frappe.utils import now_datetime


@frappe.whitelist()
def create_order(table, customer=None, items=None, company=None, branch=None):
    if isinstance(items, str):
        items = json.loads(items)

    if not items:
        frappe.throw("No items received")

    tab = frappe.get_doc("Restaurant Table", table)
    customer = frappe.get_value("Customer", customer) if customer else None
    if tab.current_order:
        order = frappe.get_doc("Restaurant Order", tab.current_order)
        if order.workflow_state == "Ready":
            order.workflow_state = "Cooking"

    else:
        order = frappe.new_doc("Restaurant Order")
        order.table = table
        order.company = company
        order.restaurant_branch = branch
        order.customer = customer
        order.order_type = "Dine-In"
        order.workflow_state = "Cooking"

    for i in items:
        item_code = i.get("item")
        qty = int(i.get("qty", 1))
        sent = int(i.get("sent_qty", 0))
        existing = None
        for row in order.items:
            if row.item == item_code:
                existing = row
                break

        if existing:
            existing.qty += qty
            existing.last_batch_qty = qty - sent
            # existing.sent_qty += qty
            existing.is_new_item = 1
            existing.status = "Cooking"
            order.workflow_state = "Cooking"

            if existing.last_batch_qty > 0:
                existing.last_batch_qty = existing.qty - existing.sent_qty
        else:
            order.append("items", {
                "item": item_code,
                "qty": qty,
                "last_batch_qty": qty,
                "status": "Cooking",
                "is_new_item": 1
            })
            order.workflow_state = "Cooking"

    if order.is_new():
        order.insert(ignore_permissions=True)
        frappe.db.set_value(
            "Restaurant Table",
            table,
            {
                "status": "Occupied",
                "current_order": order.name
            }
        )
    else:
        order.save(ignore_permissions=True)

    return order.name

@frappe.whitelist()
def finalize_bill(table, discount=0, payment_mode="Cash", company=None):
    try:
        tab = frappe.get_doc("Restaurant Table", table)
        tab.reload() 

        if not tab.current_order:
            frappe.throw("There is No active order for this table.")

        order_id = tab.current_order
        order = frappe.get_doc("Restaurant Order", order_id)
        order.reload()

        if not company:
            company = order.company or frappe.defaults.get_default("company")

        # 2. Calculation
        subtotal = sum([flt(d.amount) for d in order.items])
        discount_pct = flt(discount)
        discount_amount = (subtotal * discount_pct) / 100
        final_amount = subtotal - discount_amount

        si = frappe.new_doc("Sales Invoice")
        si.company = company
        si.customer = order.customer
        si.custom_restaurant_order = order_id
        si.update_stock = 0
        si.posting_date = frappe.utils.nowdate()
        si.due_date = frappe.utils.nowdate()
        si.status = "Paid"
        for item in order.items:
            si.append("items", {
                "item_code": item.item,
                "qty": item.qty,
                "rate": item.rate,
                "amount": item.amount,
            })
        
        if discount_pct > 0:
            si.additional_discount_percentage = discount_pct

        # si.set_missing_values()
        si.insert(ignore_permissions=True)
        si.submit()
        pe = frappe.new_doc("Payment Entry")
        pe.payment_type = "Receive"
        pe.company = si.company
        pe.posting_date = si.posting_date
        pe.party_type = "Customer"
        pe.party = si.customer
        pe.paid_from = frappe.db.get_value("Company", si.company, "default_receivable_account")
        pe.paid_to = frappe.db.get_value("Company", si.company, "default_cash_account")
        pe.paid_amount = si.grand_total
        pe.received_amount = si.grand_total

        pe.append("references", {
            "reference_doctype": "Sales Invoice",
            "reference_name": si.name,
            "allocated_amount": si.grand_total
        })

        pe.insert(ignore_permissions=True)
        pe.submit()
        frappe.db.set_value("Restaurant Order", order_id, "workflow_state", "Closed")
        
        frappe.db.set_value("Restaurant Table", table, {
            "status": "Free",
            "current_order": ""
        })

        return {"invoice_id": si.name}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "POS Finalize Conflict Error")
        frappe.throw(f"Bill is not Finalize: {str(e)}")

@frappe.whitelist()
def get_current_order(table):
    tab = frappe.get_doc("Restaurant Table", table)

    if not tab.current_order:
        return None

    order = frappe.get_doc("Restaurant Order", tab.current_order)

    return {
        "order": order.name,
        "company": order.company,
        "restaurant_branch": order.restaurant_branch,
        "customer": order.customer,
        "items": [
            {
                "item": d.item,
                "item_name": frappe.db.get_value("Item", d.item, "item_name"),
                "qty": d.qty,
                "rate": d.rate or 0
            }
            for d in order.items
        ]
    }
