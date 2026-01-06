import time
import frappe

def free_table_after_cleaning(table_name):
    time.sleep(600)

    table = frappe.get_doc("Restaurant Table", table_name)
    if table.status != "Cleaning":
        return

    table.status = "Free"
    table.cleaning_start_time = None
    table.current_order = None
    table.save(ignore_permissions=True)
