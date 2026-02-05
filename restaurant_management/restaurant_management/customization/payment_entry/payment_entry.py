import frappe
@frappe.whitelist()
def fatch_advance_payment_id(self, method=None):
	if self.custom_reservation:
		frappe.db.set_value("Reservation", self.custom_reservation, "advance_deposite_invoice", self.name)