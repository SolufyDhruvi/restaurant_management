# Copyright (c) 2025, Dhruvi Soliya and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, add_to_date

class RestaurantTable(Document):
	pass

@frappe.whitelist()
def auto_free_tables():
	tables = frappe.get_all(
		"Restaurant Table",
		filters={"status": "Cleaning"},
		fields=["name", "cleaning_start_time","status"]
	)
	frappe.msgprint(f"{tables}")

	for t in tables:
		if t.cleaning_start_time and now_datetime() >= add_to_date(t.cleaning_start_time, minutes=15):
			table_doc = frappe.get_doc("Restaurant Table", t.name)
			table_doc.status = "Free"
			table_doc.cleaning_start_time = None
			table_doc.save(ignore_permissions=True)
