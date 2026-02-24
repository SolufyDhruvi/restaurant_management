import frappe

def get_context(context):
    context.no_cache = 1
    context.table = frappe.form_dict.get("table")

    context.include_js = [
        "/assets/frappe/js/lib/jquery/jquery.min.js",
        "/assets/frappe/js/frappe/ui/dialog.js"
    ]
