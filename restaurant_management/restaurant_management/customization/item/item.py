import frappe

@frappe.whitelist()
def get_menu_items():
    items = frappe.get_all("Item",
        filters={"disabled": 0},
        fields=["name","item_name","custom_food_type","custom_menu_category","image","standard_rate"]
    )
    menu = {}
    for i in items:
        cat = i.custom_menu_category or "Other"
        if cat not in menu:
            menu[cat] = []
        menu[cat].append(i)
    return menu
