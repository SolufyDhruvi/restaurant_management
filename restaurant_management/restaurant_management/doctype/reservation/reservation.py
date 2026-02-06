# Copyright (c) 2025, Dhruvi Soliya and contributors
# For license information, please see license.txt

# from itertools import count
import frappe
from frappe.auth import get_datetime
from frappe.model.document import Document
from frappe.modules import now_datetime
from frappe.utils import getdate


class Reservation(Document):
	def on_update(self):
		if self.workflow_state not in ("Cancelled", "Checked-In"):
			return
		for row in self.table_info:
			table = frappe.get_doc("Restaurant Table", row.table)
			removed = False

			for rd in list(table.reservation_details):
				if rd.current_reservation == self.name:
					table.remove(rd)
					removed = True
			if removed:
				table.status = 'Free'
				table.save(ignore_permissions=True)
		