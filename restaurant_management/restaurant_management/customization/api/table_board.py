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
def get_payment_accounts(company, mode_of_payment):
    return {
        "receivable": frappe.db.get_value(
            "Company",
            company,
            "default_receivable_account"
        ),
        "paid_to": frappe.db.get_value(
            "Mode of Payment Account",
            {
                "parent": mode_of_payment,
                "company": company
            },
            "default_account"
        )
    }

@frappe.whitelist()
def get_current_order_for_table(table):
	order_name = frappe.db.get_value(
		"Restaurant Table",
		table,
		"current_order"
	)

	if not order_name:
		return None

	order = frappe.get_doc("Restaurant Order", order_name)

	return {
		"name": order.name,
		"customer": order.customer,
		"items": [
			{
				"item": row.item,
				"qty": row.qty
			}
			for row in order.items
		]
	}

@frappe.whitelist()
def create_order(table, customer=None, items=None, company=None, branch=None):
    if isinstance(items, str):
        items = json.loads(items)

    if not items:
        frappe.throw("No items received")

    tab = frappe.get_doc("Restaurant Table", table)
    reservation = frappe.db.sql("""
        SELECT r.name
        FROM `tabReservation` r
        INNER JOIN `tabTable Details` ti
            ON ti.parent = r.name
        WHERE ti.table = %s
        AND r.workflow_state = 'Checked-In'
        ORDER BY r.datetime DESC
        LIMIT 1
    """, table, as_dict=True)


    reservation_id = reservation[0].name if reservation else None
    customer = frappe.get_value("Customer", customer) if customer else None
    company = frappe.defaults.get_user_default("company")
    currency = frappe.db.get_value("Company", company, "default_currency")
    if tab.current_order:
        order = frappe.get_doc("Restaurant Order", tab.current_order)
        if order.workflow_state == "Ready":
            order.workflow_state = "Open"
        if reservation_id and not order.current_reservation:
            order.current_reservation = reservation_id

    else:
        order = frappe.new_doc("Restaurant Order")
        order.table = table
        order.company = company
        order.currency = currency
        order.restaurant_branch = branch
        order.customer = customer
        order.order_type = "Dine-In"
        order.workflow_state = "Open"
        order.current_reservation = reservation_id


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
            existing.status = "Open"
            order.workflow_state = "Open"



            if existing.last_batch_qty > 0:
                existing.last_batch_qty = existing.qty - existing.sent_qty
        else:
            order.append("items", {
                "item": item_code,
                "qty": qty,
                "last_batch_qty": qty,
                "status": "Open",
                "is_new_item": 1
            })
            order.workflow_state = "Open"

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

    return {
        "order": order.name,
        "reservation": reservation_id
    }
@frappe.whitelist()
def finalize_bill(table, discount=0, payment_mode="Cash", company=None):
    try:
        # ------------------------
        # LOAD TABLE & ORDER
        # ------------------------
        tab = frappe.get_doc("Restaurant Table", table)
        tab.reload()

        if not tab.current_order:
            frappe.throw("There is no active order for this table.")

        order = frappe.get_doc("Restaurant Order", tab.current_order)

        if not company:
            company = order.company or frappe.defaults.get_default("company")

        # ------------------------
        # AMOUNT CALCULATION
        # ------------------------
        subtotal = sum(flt(d.amount) for d in order.items)
        discount_pct = flt(discount)
        discount_amount = (subtotal * discount_pct) / 100
        final_amount = subtotal - discount_amount

        company = order.company
        currency = frappe.db.get_value("Company", company, "default_currency")
        si = frappe.new_doc("Sales Invoice")
        si.company = company
        si.currency = currency
        si.customer = order.customer
        si.custom_reservation = order.current_reservation
        si.custom_restaurant_order = order.name
        si.posting_date = frappe.utils.nowdate()
        si.due_date = frappe.utils.nowdate()
        si.update_stock = 0

        for item in order.items:
            si.append("items", {
                "item_code": item.item,
                "qty": item.qty,
                "rate": item.rate,
                "amount": item.amount
            })

        if discount_pct:
            si.additional_discount_percentage = discount_pct

       
        # total_advance = 0

        # if order.current_reservation:
        #     advances = frappe.get_all(
        #         "Payment Entry",
        #         filters={
        #             "custom_reservation": order.current_reservation,
        #             "docstatus": 1,
        #             "payment_type": "Receive"
        #         },
        #         fields=["name", "unallocated_amount"]
        #     )

        #     for adv in advances:
        #         if not adv.unallocated_amount or adv.unallocated_amount <= 0:
        #             continue

        #         remaining = final_amount - total_advance
        #         if remaining <= 0:
        #             break

        #         allocate = min(adv.unallocated_amount, remaining)

        #         si.append("advances", {
        #             "reference_type": "Payment Entry",
        #             "reference_name": adv.name,
        #             # "difference_posting_date": adv.posting_date,
        #             "advance_amount": adv.unallocated_amount,
        #             "allocated_amount": allocate
        #         })
                
        #         total_advance += allocate

        si.insert(ignore_permissions=True)
        # si.reload()
        # si.submit()
        
        # si.reload()  

        # if si.outstanding_amount > 0:
        #     mop_account = frappe.db.get_value(
        #         "Mode of Payment Account",
        #         {
        #             "parent": payment_mode,
        #             "company": si.company
        #         },
        #         "default_account"
        #     )

        #     if not mop_account:
        #         frappe.throw("Mode of Payment account not found")

        #     pe = frappe.new_doc("Payment Entry")
        #     pe.payment_type = "Receive"
        #     pe.company = si.company
        #     pe.party_type = "Customer"
        #     pe.party = si.customer
        #     pe.posting_date = si.posting_date
        #     pe.mode_of_payment = payment_mode
        #     pe.custom_reservation = order.current_reservation

        #     pe.paid_from = frappe.db.get_value(
        #         "Company", si.company, "default_receivable_account"
        #     )
        #     pe.paid_to = mop_account

        #     pe.paid_amount = si.outstanding_amount
        #     pe.received_amount = si.outstanding_amount

        #     pe.append("references", {
        #         "reference_doctype": "Sales Invoice",
        #         "reference_name": si.name,
        #         "allocated_amount": si.outstanding_amount
        #     })

        #     pe.insert(ignore_permissions=True)
        #     pe.submit()

        # ------------------------
        # CLOSE ORDER & FREE TABLE
        # ------------------------
        frappe.db.set_value(
            "Restaurant Order",
            order.name,
            "workflow_state",
            "Closed"
        )

        frappe.db.set_value(
            "Restaurant Table",
            table,
            {
                "status": "Free",
                "current_order": ""
            }
        )
        frappe.db.set_value("Reservation",si.custom_reservation,{"workflow_state": "Check-Out"})

        return {
            "invoice_id": si.name,
            "grand_total": si.grand_total,
            "total_advance": si.total_advance,
            "outstanding_amount": si.outstanding_amount
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Finalize Bill Error")
        frappe.throw(str(e))

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
        "current_reservation": order.current_reservation,
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
