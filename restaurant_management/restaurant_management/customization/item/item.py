import frappe
import json

@frappe.whitelist()
def get_menu_items():
    items = frappe.get_all(
        "Item",
        filters={
            "custom_is_menu_item": 1,
            "disabled": 0
        },
        fields=[
            "name",
            "item_name",
            "standard_rate",
            "custom_food_type",
            "custom_menu_category"
        ],
        order_by="custom_menu_category, item_name"
    )

    menu = {"Veg": [], "Non Veg": [], "Beverage": []}

    for item in items:
        if item.custom_menu_category == "Beverage":
            menu["Beverage"].append(item)
        elif item.custom_food_type == "Veg":
            menu["Veg"].append(item)
        else:
            menu["Non Veg"].append(item)

    return menu
