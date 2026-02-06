frappe.pages['restaurant-menu'].on_page_load = function(wrapper) {

    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Restaurant Menu',
        single_column: true
    });

    // Add custom style
    let style = `
    <style>
        h4 {
            margin-top: 25px;
            color: #2c3e50;
            padding-left: 10px;
        }

        .menu-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 18px;
        }

        .menu-card {
            background: #ffffff;
            padding: 20px;
            border-radius: 16px;
            box-shadow: 0 6px 15px rgba(0,0,0,.05);
            text-align: center;
            transition: transform .3s, box-shadow .3s;
            cursor: pointer;
        }

        .menu-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(0,0,0,.12);
        }

        .menu-card b {
            font-size: 18px;
            color: #34495e;
        }

        .price {
            color: #1abc9c; /* teal */
            font-weight: bold;
            margin: 8px 0;
            font-size: 16px;
        }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            color: white;
            margin-bottom: 6px;
        }

        .Veg { background: #27ae60; }
        .Non\\ Veg { background: #e74c3c; }
        .Beverage { background: #3498db; }
    </style>`;

    page.main.html(`${style}<div id="menu"></div>`);

    load_menu();
};

// Helper to get table from URL ?table=T01
function get_table_number_from_url() {
    let params = new URLSearchParams(window.location.search);
    return params.get("table");
}
function load_menu(){
    let table_number = get_table_number_from_url();

    if (!table_number) {
        frappe.msgprint("Table not found. Please scan valid QR code.");
        return;
    }

    frappe.call({
        method:"restaurant_management.restaurant_management.customization.item.item.get_menu_items",
        callback:r => render_menu(r.message, table_number)
    });
}


function render_menu(menu, table_number){
    let html = "";

    ["Veg","Non Veg","Beverage"].forEach(section => {
        if(menu[section]?.length){
            html += `<h4>${section}</h4><div class="menu-grid">`;

            menu[section].forEach(item => {
                html += `
                <div class="menu-card"
                     onclick="open_create_order_dialog('${table_number}', {items:[{item:'${item.name}', qty:1}]})">
                    <b>${item.item_name}</b>
                    <div class="price">₹ ${item.standard_rate}</div>
                </div>`;
            });

            html += `</div>`;
        }
    });

    $("#menu").html(html);
}

// =================== ORDER DIALOG ===================

function open_create_order_dialog(table_number, data) {

    // Default values
    let items = data.items || [];

    let dialog = new frappe.ui.Dialog({
        title: "Create Restaurant Order",
        size: "large",
        fields: [
            {
                label:"Table",
                fieldname:"table",
                fieldtype:"Data",
                read_only:1,
                default: table_number
            },
            {
                label:"Customer",
                fieldname:"customer",
                fieldtype:"Link",
                options:"Customer",
                default:""
            },
            {
                label:"Items",
                fieldname:"items",
                fieldtype:"Table",
                reqd:1,
                data: items,
                fields:[
                    {
                        label:"Item",
                        fieldname:"item",
                        fieldtype:"Link",
                        options:"Item",
                        in_list_view:1,
                        reqd:1
                    },
                    {
                        label:"Qty",
                        fieldname:"qty",
                        fieldtype:"Int",
                        default:1,
                        in_list_view:1
                    }
                ]
            }
        ],
        primary_action_label:"Create Order",
        primary_action(values){
            frappe.call({
                method:"restaurant_management.restaurant_management.customization.api.table_board.create_order",
                args: values,
                callback(r){
                    if(r.message){
                        frappe.msgprint(`Order ${r.message} Created Successfully!`);
                        dialog.hide();
                    } else {
                        frappe.msgprint("Something went wrong!");
                    }
                }
            });
        }
    });

    dialog.show();
}
