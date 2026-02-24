import frappe

def update_reservation_on_payment(self, method=None):
    if not self.custom_reservation:
        return

    reservation = frappe.get_doc("Reservation", self.custom_reservation)

    if reservation.workflow_state == "Requested":
        reservation.workflow_state = "Confirmed"
        reservation.save(ignore_permissions=True)

        frappe.msgprint(f"Reservation {reservation.name} Confirmed Automatically")
