// frappe.pages['restaurant-menu'].on_page_load = function(wrapper) {

//     let page = frappe.ui.make_app_page({
//         parent: wrapper,
//         title: 'Restaurant Menu',
//         single_column: true
//     });

//     // Add custom style
//     let style = `
//     <style>
//         h4 {
//             margin-top: 25px;
//             color: #2c3e50;
//             padding-left: 10px;
//         }

//         .menu-grid {
//             display: grid;
//             grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
//             gap: 18px;
//         }

//         .menu-card {
//             background: #ffffff;
//             padding: 20px;
//             border-radius: 16px;
//             box-shadow: 0 6px 15px rgba(0,0,0,.05);
//             text-align: center;
//             transition: transform .3s, box-shadow .3s;
//             cursor: pointer;
//         }

//         .menu-card:hover {
//             transform: translateY(-5px);
//             box-shadow: 0 12px 24px rgba(0,0,0,.12);
//         }

//         .menu-card b {
//             font-size: 18px;
//             color: #34495e;
//         }

//         .price {
//             color: #1abc9c; /* teal */
//             font-weight: bold;
//             margin: 8px 0;
//             font-size: 16px;
//         }

//         .badge {
//             display: inline-block;
//             padding: 2px 8px;
//             border-radius: 12px;
//             font-size: 12px;
//             color: white;
//             margin-bottom: 6px;
//         }

//         .Veg { background: #27ae60; }
//         .Non\\ Veg { background: #e74c3c; }
//         .Beverage { background: #3498db; }
//     </style>`;

//     page.main.html(`${style}<div id="menu"></div>`);

//     load_menu();
// };

// // Helper to get table from URL ?table=T01
// function get_table_number_from_url() {
//     let params = new URLSearchParams(window.location.search);
//     return params.get("table");
// }
// function load_menu(){
//     let table_number = get_table_number_from_url();

//     if (!table_number) {
//         frappe.msgprint("Table not found. Please scan valid QR code.");
//         return;
//     }

//     frappe.call({
//         method:"restaurant_management.restaurant_management.customization.item.item.get_menu_items",
//         callback:r => render_menu(r.message, table_number)
//     });
// }


// function render_menu(menu, table_number){
//     let html = "";

//     ["Veg","Non Veg","Beverage"].forEach(section => {
//         if(menu[section]?.length){
//             html += `<h4>${section}</h4><div class="menu-grid">`;

//             menu[section].forEach(item => {
//                 html += `
//                 <div class="menu-card"
//                      onclick="open_create_order_dialog(
//                             '${table_number}',
//                             '${item.name}'
//                         )"

//                     <b>${item.item_name}</b>
//                     <div class="price">₹ ${item.standard_rate}</div>
//                 </div>`;
//             });

//             html += `</div>`;
//         }
//     });

//     $("#menu").html(html);
// }

// // =================== ORDER DIALOG ===================

// function open_create_order_dialog(table_number, clicked_item = null) {

//     frappe.call({
//         method: "restaurant_management.restaurant_management.customization.api.table_board.get_current_order_for_table",
//         args: { table: table_number },
//         callback: function (r) {

//             let old_items = [];
//             let customer = "";
//             let new_items = [];

//             if (r.message) {
//                 old_items = r.message.items || [];
//                 customer = r.message.customer || "";
//             }

//             // ✅ AUTO ADD CLICKED ITEM
//             if (clicked_item) {
//                 new_items.push({
//                     item: clicked_item,
//                     qty: 1
//                 });
//             }

//             let dialog = new frappe.ui.Dialog({
//                 title: "Restaurant Order",
//                 size: "large",
//                 fields: [

//                     {
//                         fieldtype: "Data",
//                         fieldname: "table",
//                         label: "Table",
//                         default: table_number,
//                         read_only: 1
//                     },
//                     {
//                         fieldtype: "Link",
//                         fieldname: "customer",
//                         label: "Customer",
//                         options: "Customer",
//                         default: customer
//                     },

//                     { fieldtype: "Section Break", label: "Old Orders" },

//                     {
//                         fieldtype: "Table",
//                         fieldname: "old_items",
//                         read_only: 1,
//                         data: old_items,
//                         fields: [
//                             {
//                                 fieldtype: "Link",
//                                 fieldname: "item",
//                                 options: "Item",
//                                 in_list_view: 1,
//                                 read_only: 1
//                             },
//                             {
//                                 fieldtype: "Int",
//                                 fieldname: "qty",
//                                 in_list_view: 1,
//                                 read_only: 1
//                             }
//                         ]
//                     },

//                     { fieldtype: "Section Break", label: "Add New Items" },

//                     {
//                         fieldtype: "Table",
//                         fieldname: "items",
//                         reqd: 1,
//                         data: new_items,   // 🔥 IMPORTANT
//                         fields: [
//                             {
//                                 fieldtype: "Link",
//                                 fieldname: "item",
//                                 options: "Item",
//                                 in_list_view: 1,
//                                 reqd: 1
//                             },
//                             {
//                                 fieldtype: "Int",
//                                 fieldname: "qty",
//                                 in_list_view: 1,
//                                 default: 1
//                             }
//                         ]
//                     }
//                 ],

//                 primary_action_label: "Place Order",
//                 primary_action(values) {

//                     if (!values.items || values.items.length === 0) {
//                         frappe.msgprint("Please add new items");
//                         return;
//                     }

//                     frappe.call({
//                         method: "restaurant_management.restaurant_management.customization.api.table_board.create_order",
//                         args: {
//                             table: values.table,
//                             customer: values.customer,
//                             items: values.items
//                         },
//                         callback(r) {
//                             frappe.msgprint(`Order ${r.message} Updated`);
//                             dialog.hide();
//                         }
//                     });
//                 }
//             });

//             dialog.show();
//         }
//     });
// }

frappe.pages['restaurant-menu'].on_page_load = function(wrapper) {

    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Restaurant Menu',
        single_column: true
    });

    let style = `
    <style>
        body { background: #f4f6f8; }

        h4 { margin: 25px 0 10px; }

        /* Search Bar */
        #menu-search { 
            width: 100%; 
            padding: 12px 15px; 
            border-radius: 8px; 
            border: 1px solid #ccc; 
            margin-bottom: 15px; 
            font-size: 16px;
        }

        /* Tabs */
        .category-tabs { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }
        .category-tab { padding: 8px 16px; border-radius: 8px; cursor: pointer; background: #fff; box-shadow: 0 4px 10px rgba(0,0,0,.05); transition: 0.2s; }
        .category-tab.active { background: #27ae60; color: #fff; }

        /* Veg/Non-Veg Filter Buttons */
        .veg-filter { margin-bottom: 15px; }
        .veg-btn {
            padding: 6px 14px;
            border-radius: 6px;
            border: 1px solid #ccc;
            background: #fff;
            cursor: pointer;
            margin-right: 6px;
            transition: 0.2s;
        }
        .veg-btn.active {
            background: #27ae60;
            color: #fff;
            border-color: #27ae60;
        }

        .menu-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 18px;
        }

        .menu-card {
            background: #fff;
            border-radius: 18px;
            box-shadow: 0 8px 20px rgba(0,0,0,.06);
            overflow: hidden;
            cursor: pointer;
            transition: transform .25s, box-shadow .25s;
            position: relative;
        }

        .menu-card:hover { transform: translateY(-5px); box-shadow: 0 12px 28px rgba(0,0,0,.12); }

        .menu-img { width: 100%; height: 160px; object-fit: cover; background: #eee; }

        .menu-body { padding: 14px; text-align: center; }
        .menu-body b { font-size: 16px; color: #34495e; display: block; }

        .price { color: #27ae60; font-weight: bold; margin-top: 6px; font-size: 15px; }

        /* Veg/Non-Veg dot */
        .veg-nonveg { 
            position: absolute; top: 10px; left: 10px; 
            width: 20px; height: 20px; 
            border-radius: 50%; 
            border: 2px solid #fff; 
        }
        .Veg { background: #27ae60; }
        .NonVeg { background: #e74c3c; }
    </style>`;

    page.main.html(`${style}
        <input type="text" id="menu-search" placeholder="Search items...">
        <div class="category-tabs" id="category-tabs"></div>
        <div class="veg-filter">
            <button class="veg-btn active" data-type="All">All</button>
            <button class="veg-btn" data-type="Veg">Veg</button>
            <button class="veg-btn" data-type="Non Veg">Non Veg</button>
        </div>
        <div id="menu"></div>`);

    load_menu();
};

// ---------------- HELPERS ----------------
function get_table_number_from_url() {
    return new URLSearchParams(window.location.search).get("table");
}

let global_menu_data = {}; // Store menu for search/filter
let active_filter_type = "All"; // default filter

function load_menu() {
    let table = get_table_number_from_url();

    if (!table) {
        frappe.msgprint("Invalid Table QR");
        return;
    }

    frappe.call({
        method: "restaurant_management.restaurant_management.customization.item.item.get_menu_items",
        callback: r => {
            if (!r.message) return frappe.msgprint("No menu items found");
            global_menu_data = r.message;

            render_category_tabs(r.message);
            // show first category by default
            render_menu_by_category(Object.keys(r.message)[0], table, active_filter_type);
        }
    });
}

// ---------------- CATEGORY TABS ----------------
function render_category_tabs(menu) {
    let tabs_html = "";
    Object.keys(menu).forEach((category, index) => {
        if(category === "Other") return;
        tabs_html += `<div class="category-tab ${index===0?'active':''}" data-category="${category}">${category}</div>`;
    });
    $("#category-tabs").html(tabs_html);

    $(".category-tab").on("click", function() {
        $(".category-tab").removeClass("active");
        $(this).addClass("active");
        let cat = $(this).data("category");
        render_menu_by_category(cat, get_table_number_from_url(), active_filter_type);
    });
}

// ---------------- VEG/NON-VEG FILTER ----------------
$(document).on("click", ".veg-btn", function() {
    $(".veg-btn").removeClass("active");
    $(this).addClass("active");
    active_filter_type = $(this).data("type");

    let active_category = $(".category-tab.active").data("category");
    render_menu_by_category(active_category, get_table_number_from_url(), active_filter_type);
});

// ---------------- RENDER MENU ----------------
function render_menu_by_category(category, table, filterType="All") {
    let items = global_menu_data[category] || [];

    // Apply Veg/Non-Veg filter
    if(filterType !== "All") {
        items = items.filter(i => i.custom_food_type === filterType);
    }

    let html = "";

    items.forEach(item => {
        let img = item.image ? frappe.utils.get_file_link(item.image) : "/assets/restaurant_management/images/food-placeholder.png";
        let type_class = (item.custom_food_type === "Non Veg") ? "NonVeg" : "Veg";

        html += `
            <div class="menu-card" data-item="${item.name}">
                <span class="veg-nonveg ${type_class}"></span>
                <img src="${img}" class="menu-img">
                <div class="menu-body">
                    <b>${item.item_name}</b>
                    <div class="price">₹ ${item.standard_rate}</div>
                </div>
            </div>`;
    });

    $("#menu").html(`<div class="menu-grid">${html}</div>`);

    // Item click
    $(".menu-card").on("click", function() {
        let clicked_item = $(this).data("item");
        open_create_order_dialog(table, clicked_item);
    });

    // ---------------- SEARCH ----------------
    $("#menu-search").off("input").on("input", function() {
        let query = $(this).val().toLowerCase();
        let filtered_items = items.filter(i => i.item_name.toLowerCase().includes(query));
        let html_filtered = "";

        filtered_items.forEach(item => {
            let img = item.image ? frappe.utils.get_file_link(item.image) : "/assets/restaurant_management/images/food-placeholder.png";
            let type_class = (item.custom_food_type === "Non Veg") ? "NonVeg" : "Veg";

            html_filtered += `
                <div class="menu-card" data-item="${item.name}">
                    <span class="veg-nonveg ${type_class}"></span>
                    <img src="${img}" class="menu-img">
                    <div class="menu-body">
                        <b>${item.item_name}</b>
                        <div class="price">₹ ${item.standard_rate}</div>
                    </div>
                </div>`;
        });

        $("#menu").html(`<div class="menu-grid">${html_filtered}</div>`);

        $(".menu-card").on("click", function() {
            let clicked_item = $(this).data("item");
            open_create_order_dialog(table, clicked_item);
        });
    });
}

// ---------------- ORDER DIALOG ----------------
function open_create_order_dialog(table, clicked_item = null) {

    frappe.call({
        method: "restaurant_management.restaurant_management.customization.api.table_board.get_current_order_for_table",
        args: { table },
        callback(r) {

            let old_items = [];
            let customer = "";
            let new_items = [];

            if (r.message) {
                old_items = r.message.items || [];
                customer = r.message.customer || "";
            }

            if (clicked_item) {
                new_items.push({ item: clicked_item, qty: 1 });
            }

            let dialog = new frappe.ui.Dialog({
                title: "Restaurant Order",
                size: "large",
                fields: [
                    { fieldtype: "Data", fieldname: "table", label: "Table", default: table, read_only: 1 },
                    { fieldtype: "Link", fieldname: "customer", label: "Customer", options: "Customer", default: customer },

                    { fieldtype: "Section Break", label: "Old Orders" },
                    { fieldtype: "Table", fieldname: "old_items", data: old_items, read_only: 1, fields:[
                        { fieldtype: "Link", fieldname: "item", options: "Item", in_list_view: 1 },
                        { fieldtype: "Int", fieldname: "qty", in_list_view: 1 }
                    ]},

                    { fieldtype: "Section Break", label: "Add New Items" },
                    { fieldtype: "Table", fieldname: "items", data: new_items, reqd: 1, fields:[
                        { fieldtype: "Link", fieldname: "item", options: "Item", in_list_view: 1, reqd: 1 },
                        { fieldtype: "Int", fieldname: "qty", default: 1, in_list_view: 1 }
                    ]}
                ],

                primary_action_label: "Place Order",
                primary_action(values) {
                    if (!values.items || values.items.length === 0) {
                        frappe.msgprint("Please add items");
                        return;
                    }
                    frappe.call({
                        method: "restaurant_management.restaurant_management.customization.api.table_board.create_order",
                        args: { table: values.table, customer: values.customer, items: values.items },
                        callback(r) {
                            frappe.msgprint(`Order ${r.message} Updated`);
                            dialog.hide();
                        }
                    });
                }
            });

            dialog.show();
        }
    });
}
