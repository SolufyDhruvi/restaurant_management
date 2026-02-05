# Copyright (c) 2025, Dhruvi Soliya and contributors
# For license information, please see license.txt

# from itertools import count
import frappe
from frappe.auth import get_datetime
from frappe.model.document import Document
from frappe.modules import now_datetime
from frappe.utils import getdate


class Reservation(Document):
    pass
	# def on_update(self):
	# 	if self.workflow_state == "Confirmed":
	# 		for i in self.table_info:
	# 			frappe.db.set_value(
	# 				"Restaurant Table",
	# 				i.table,
	# 				{
	# 					"status": "Reserved",
	# 					"current_reservation": self.name,
	# 					"reservation_datetime": self.datetime
	# 				}
	# 			)
	# 	elif self.workflow_state == "Checked-In" and self.table_info:
	# 		for i in self.table_info:
	# 			frappe.db.set_value(
	# 				"Restaurant Table",
	# 				i.table,
	# 				{
	# 					"status": "Occupied"
	# 				}
	# 			)
	# @frappe.whitelist()
	# def make_advance_deposite_sales_invoice(self):
	# 	pe = frappe.new_doc("Payment Entry")
	# 	pe.payment_type = "Receive"
	# 	pe.party_type = "Customer"
	# 	pe.party = self.customer
	# 	pe.party_name = self.customer
	# 	pe.company = self.company
	# 	pe.custom_reservation = self.name

	# 	settings = frappe.get_doc("Restaurant Setting", "Restaurant Setting")
	# 	table_count = len(self.table_info)
	# 	total = 0
	# 	if settings.advance_policy == "Per Table":
	# 		total = table_count * settings.advance_per_table
	# 	elif settings.advance_policy == "Per Guest":
	# 		total = table_count * settings.advance_per_guest
	# 	pe.paid_amount = total
	# 	pe.received_amount = total
	# 	return pe.as_dict()

# @frappe.whitelist()
# def create_reservation(
# 	table,
# 	customer,
# 	mobile=None,
# 	email_id=None,
# 	guest_no=1,
# 	datetime=None
# ):
# 	if not table:
# 		frappe.throw("Table is required")

# 	if not customer:
# 		frappe.throw("Customer name is required")

# 	table_doc = frappe.get_doc("Restaurant Table", table)

# 	if table_doc.status != "Free":
# 		frappe.throw(f"Table {table} is not available for reservation")

# 	reservation = frappe.get_doc({
# 		"doctype": "Reservation",
# 		"customer": customer,
# 		"mobile": mobile,
# 		"email_id": email_id,
# 		"guest_no": guest_no,
# 		"datetime": datetime or now_datetime(),
# 		"workflow_state": "Requested",

# 		"table_info": [
# 			{
# 				"table": table
# 			}
# 		]
# 	})

# 	reservation.insert(ignore_permissions=True)

# 	table_doc.status = "Reserved"
# 	table_doc.current_reservation = reservation.name
# 	table_doc.save(ignore_permissions=True)

# 	frappe.db.commit()

# 	return {
# 		"reservation": reservation.name,
# 		"table": table,
# 		"status": "Reserved"
# 	}

# from frappe.utils import now_datetime

