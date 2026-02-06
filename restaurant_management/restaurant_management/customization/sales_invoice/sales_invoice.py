import frappe
@frappe.whitelist()
def fetch_name_sales_invoice(self,method=None):
	if self.custom_restaurant_order:
		frappe.db.set_value("Restaurant Order", self.custom_restaurant_order, "sales_invoice", self.name)
	