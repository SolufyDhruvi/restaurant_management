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


@frappe.whitelist()
def place_online_order(cart, customer_name, phone, address):
    cart = json.loads(cart)

    # CUSTOMER
    customer = frappe.db.get_value("Customer", {"mobile_no": phone}, "name")
    if not customer:
        cust = frappe.new_doc("Customer")
        cust.customer_name = customer_name
        cust.customer_type = "Individual"
        cust.mobile_no = phone
        cust.insert(ignore_permissions=True)
        customer = cust.name

    # SALES ORDER
    so = frappe.new_doc("Sales Order")
    so.customer = customer
    so.order_type = "Shopping Cart"
    so.delivery_address = address

    for item in cart.values():
        so.append("items", {
            "item_code": item["code"],
            "qty": item["qty"],
            "rate": item["price"]
        })

    so.insert(ignore_permissions=True)
    # so.submit()

    return {
        "order_id": so.name,
        "message": "Order placed successfully"
    }
