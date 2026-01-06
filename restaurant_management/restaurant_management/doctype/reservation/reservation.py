# Copyright (c) 2025, Dhruvi Soliya and contributors
# For license information, please see license.txt

# from itertools import count
import frappe
from frappe.auth import get_datetime
from frappe.model.document import Document
from frappe.modules import now_datetime


class Reservation(Document):
	# def validate(self):
	# 	reservation_time = get_datetime(self.datetime)
	# 	current_time = now_datetime()

	# 	if reservation_time <= current_time:
	# 		frappe.throw("Reservation time must be in the future")
	def on_update(self):
		frappe.msgprint("hello")
		if self.workflow_state == "Confirmed":
			for i in self.table_info:
				frappe.db.set_value(
					"Restaurant Table",
					i.table,
					{
						"status": "Reserved",
						"current_reservation": self.name,
						"reservation_datetime": self.datetime
					}
				)
		elif self.workflow_state == "Checked-In" and self.table_info:
			for i in self.table_info:
				frappe.db.set_value(
					"Restaurant Table",
					i.table,
					{
						"status": "Occupied"
					}
				)
	@frappe.whitelist()
	def make_advance_deposite_sales_invoice(self):
		si = frappe.new_doc("Sales Invoice")
		si.customer = self.customer
		si.company = self.company
		si.due_date = frappe.utils.nowdate()
		si.custom_reservation = self.name
		rate = frappe.get_doc("Restaurant Setting", "Restaurant Setting")
		if rate.advance_policy == "Per Table":
			for row in self.table_info:
				table_count = len(self.table_info)
			si.append("items",{
				"item_code": "Advance Deposite",
				"item_name": "Advance Deposite",
				"qty": table_count,
				"rate": rate.advance_per_table,
			})
		elif rate.advance_policy == "Per Guest":
			for row in self.table_info:
				table_count = len(self.table_info)
			si.append("items",{
				"item_code": "Advance Deposite",
				"item_name": "Advance Deposite",
				"qty": table_count,
				"rate": rate.advance_per_guest,
			})
		return si.as_dict()
