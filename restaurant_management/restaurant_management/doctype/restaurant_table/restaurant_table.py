# Copyright (c) 2025, Dhruvi Soliya and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import get_datetime, now_datetime, add_to_date

class RestaurantTable(Document):
    def before_validate(self):
        if self.status == "Cleaning":
            self.current_reservation = None
            self.current_order = None
            
            