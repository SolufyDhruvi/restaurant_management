# Copyright (c) 2025, Dhruvi Soliya and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document


class RestaurantOrder(Document):

	def on_update(self):
		if not self.table:
			return

		if self.workflow_state != "Billed":
			return

		table = frappe.get_doc("Restaurant Table", self.table)

		if table.status == "Cleaning":
			return

		table.status = "Cleaning"
		table.cleaning_start_time = frappe.utils.now_datetime()
		table.current_order = None
		table.save(ignore_permissions=True)



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
		items = []
		for i in doc.items:
			items.append({
				"item": i.item,
				"qty": i.qty
			})
		results.append({
			"name": o.name,
			"table": o.table,
			"workflow_state": o.workflow_state,
			"items": items
		})
	return results
