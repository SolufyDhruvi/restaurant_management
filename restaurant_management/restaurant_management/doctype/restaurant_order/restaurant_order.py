# Copyright (c) 2025, Dhruvi Soliya and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime

class RestaurantOrder(Document):
	# def before_validate(self):
	# 	if self.items:
	# 		for i in self.items:
	# 			if i.qty and i.rate:
	# 				i.amount += i.qty * i.rate
	def on_update(self):				
		if self.workflow_state == "Billed" and self.table:
			frappe.db.set_value(
				"Restaurant Table",
				self.table,
				{
					"status": "Cleaning",
					"cleaning_start_time": now_datetime(),
					"current_order": None
				}
			)
			frappe.enqueue(
				method="restaurant_management.restaurant_management.customization.restaurant_table.restaurant_table.free_table_after_cleaning",
				queue="long",
				table_name=self.table,
				enqueue_after_commit=True
			)
	
	def before_save(self):
		if self.workflow_state == "Cooking":
			for i in self.items:
				if i.status == "Pending":
					i.status = "Cooking"
		elif self.workflow_state == "Ready":
			for i in self.items:
				if i.status == "Cooking":
					i.status = "Ready"
					i.is_new_item = 0
		

	@frappe.whitelist()
	def make_sales_invoice(self):
		si = frappe.new_doc("Sales Invoice")
		si.customer = self.customer
		si.company = self.company
		si.due_date = frappe.utils.nowdate()
		si.custom_restaurant_order = self.name
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
	orders = frappe.get_all(
		"Restaurant Order",
		filters={"workflow_state": ["in", ["Placed", "Cooking"]]},
		fields=["name","table","workflow_state"],
		order_by="creation asc"
	)

	results = []
	for o in orders:
		doc = frappe.get_doc("Restaurant Order", o.name)

		items_to_cook = [
			i for i in doc.items
			if i.is_new_item == 1 and i.status in ("Pending", "Cooking")
		]

		if not items_to_cook:
			continue

		items_list = []
		for i in items_to_cook:
			items_list.append({
				"item": i.item,
				"qty": i.qty
			})

		results.append({
			"name": o.name,
			"table": o.table,
			"workflow_state": o.workflow_state,
			"items": items_list
		})

	return results
