import json
import frappe


@frappe.whitelist()
def create_order(table, order_type, customer=None, items=None):

	# ---------- VALIDATION ----------
	if not table:
		frappe.throw("Table is required")

	if not items:
		frappe.throw("Items are required")

	# Lock table to prevent race condition
	table_doc = frappe.get_doc("Restaurant Table", table)

	if table_doc.status != "Free":
		frappe.throw("Table is not Free")

	# ---------- CREATE ORDER ----------
	order = frappe.new_doc("Restaurant Order")
	order.table = table
	order.order_type = order_type
	order.customer = customer
	order.workflow_state = "Draft"

	if isinstance(items, str):
		items = json.loads(items)

	for row in items:
		order.append("items", {
			"item": row.get("item"),
			"qty": row.get("qty", 1)
		})

	order.insert(ignore_permissions=True)

	# ---------- UPDATE TABLE ----------
	table_doc.status = "Occupied"
	table_doc.current_order = order.name
	table_doc.save(ignore_permissions=True)

	return order.name
