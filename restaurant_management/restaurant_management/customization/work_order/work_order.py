# restaurant_management/restaurant_management/doctype/work_order/work_order.py
import frappe
@frappe.whitelist()
def on_update(self, method=None):
	if self.work_order:
		wo = frappe.get_doc("Work Order",self.work_order)
		if wo.status == "Completed":
			if wo.custom_restaurant_order:
				ro = frappe.get_doc("Restaurant Order", wo.custom_restaurant_order)
				item_updated = False
				for row in ro.items:
					if row.item == wo.production_item and row.is_new_item == 1:
						if row.status != "Ready":
							row.status = "Ready"
							row.is_new_item = 0
							item_updated = True

				if item_updated:
					ro.save(ignore_permissions=True)

	# if self.status == "Completed":
	# 	frappe.throw(":::::::::::")
	# 	from restaurant_management.restaurant_management.doctype.restaurant_order.restaurant_order import update_order_status_from_work_order
	# 	update_order_status_from_work_order(self)
		
	# 	if self.status != "Completed":
	# 		return

	# 	if not self.custom_restaurant_order:
	# 		return

	# 	ro = frappe.get_doc("Restaurant Order", self.custom_restaurant_order)
	# 	frappe.msgprint(f"{ro}")
	# 	item_updated = False

	# 	for row in ro.items:
	# 		if row.item == self.production_item:
	# 			frappe.msgprint(f"{self.production_item}")
	# 			frappe.msgprint(f"item:{row.item}")
	# 			if row.status != "Ready":
	# 				row.status = "Ready"
	# 				item_updated = True

	# 	if item_updated:
	# 		ro.save(ignore_permissions=True)