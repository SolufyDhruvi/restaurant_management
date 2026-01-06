// frappe.pages['restaurant-table-lay'].on_page_load = function(wrapper) {

// 	let page = frappe.ui.make_app_page({
// 		parent: wrapper,
// 		title: 'Table Occupancy Board',
// 		single_column: true
// 	});

// 	let filters = $(`
// 		<div class="row mb-3" style="align-items:center; gap:10px;">
// 			<div class="col-md-3">
// 				<select id="floor-filter" class="form-control form-select">
// 					<option value="">All Floors</option>
// 				</select>
// 			</div>
// 			<div class="col-md-3">
// 				<select id="status-filter" class="form-control form-select">
// 					<option value="">All Status</option>
// 					<option value="Free">Free</option>
// 					<option value="Reserved">Reserved</option>
// 					<option value="Occupied">Occupied</option>
// 				</select>
// 			</div>
// 		</div>
// 	`).appendTo(page.body);

// 	let container = $('<div class="row g-3 table-board"></div>').appendTo(page.body);

// 	frappe.call({
// 		method: "frappe.client.get_list",
// 		args: {
// 			doctype: "Restaurant Floor",
// 			fields: ["name"],
// 			filters: { is_active: 1 }
// 		},
// 		callback(r) {
// 			(r.message || []).forEach(f => {
// 				$('#floor-filter').append(`<option value="${f.name}">${f.name}</option>`);
// 			});
// 		}
// 	});

// 	function load_tables() {
// 		container.empty();

// 		let filters = { is_active: 1 };
// 		let floor = $('#floor-filter').val();
// 		let status = $('#status-filter').val();
// 		if (floor) filters.floor = floor;
// 		if (status) filters.status = status;

// 		frappe.call({
// 			method: "frappe.client.get_list",
// 			args: {
// 				doctype: "Restaurant Table",
// 				fields: ["name", "status", "seating_capacity", "floor"],
// 				filters: filters
// 			},
// 			callback: function(r) {

// 				(r.message || []).forEach(t => {

// 					let gradient = {
// 						"Free": "linear-gradient(135deg, #a8e063, #56ab2f)",
// 						"Reserved": "linear-gradient(135deg, #ffcc70, #ff6f00)",
// 						"Occupied": "linear-gradient(135deg, #ff5858, #b00020)"
// 					}[t.status] || "linear-gradient(135deg, #90a4ae, #cfd8dc)";

// 					let badgeColor = {
// 						"Free": "#2e7d32",
// 						"Reserved": "#ef6c00",
// 						"Occupied": "#c62828"
// 					}[t.status];

// 					container.append(`
// 						<div class="col-xl-2 col-lg-3 col-md-4 col-sm-6">
// 							<div class="table-card" data-name="${t.name}" style="
// 								background: ${gradient};
// 								border-radius: 18px;
// 								padding: 20px;
// 								color: #fff;
// 								box-shadow: 0 8px 25px rgba(0,0,0,0.25);
// 								cursor: pointer;
// 								position: relative;
// 								transition: transform 0.35s ease, box-shadow 0.35s ease;
// 							">
// 								<span class="status-badge" style="
// 									position:absolute;
// 									top:12px;
// 									right:12px;
// 									background:${badgeColor};
// 									color:white;
// 									padding:4px 10px;
// 									border-radius:20px;
// 									font-size:12px;
// 									font-weight:600;
// 								">${t.status}</span>

// 								<h4 style="margin:0 0 8px; font-weight:600;">${t.name}</h4>
// 								<p style="margin:4px 0;">Floor: <b>${t.floor || '-'}</b></p>
// 								<p style="margin:4px 0;">Seats: <b>${t.seating_capacity}</b></p>
// 							</div>
// 						</div>
// 					`);
// 				});

// 				/* -------- HOVER EFFECT -------- */
// 				$('.table-card').hover(
// 					function() {
// 						$(this).css({
// 							transform: 'translateY(-12px) scale(1.05)',
// 							boxShadow: '0 20px 45px rgba(0,0,0,0.35)'
// 						});
// 					},
// 					function() {
// 						$(this).css({
// 							transform: 'translateY(0) scale(1)',
// 							boxShadow: '0 8px 25px rgba(0,0,0,0.25)'
// 						});
// 					}
// 				);
// 			}
// 		});
// 	}

// 	/* ---------------- FILTER CHANGE ---------------- */
// 	$('#floor-filter, #status-filter').on('change', load_tables);

// 	/* ---------------- CLICK → CREATE ORDER ---------------- */
// 	page.body.on('click', '.table-card', function () {
// 		let table_name = $(this).data('name');

// 		let dialog = new frappe.ui.Dialog({
// 			title: __('Create Restaurant Order'),
// 			size: 'large',
// 			fields: [
// 				{
// 					label: 'Table',
// 					fieldname: 'table',
// 					fieldtype: 'Link',
// 					options: 'Restaurant Table',
// 					default: table_name,
// 					read_only: 1
// 				},
// 				{
// 					label: 'Order Type',
// 					fieldname: 'order_type',
// 					fieldtype: 'Select',
// 					options: 'Dine-In\nTake Away\nDelivery',
// 					default: 'Dine-In'
// 				},
// 				{
// 					label: 'Customer',
// 					fieldname: 'customer',
// 					fieldtype: 'Link',
// 					options: 'Customer'
// 				},
// 				{
// 					label: 'Items',
// 					fieldname: 'items',
// 					fieldtype: 'Table',
// 					reqd: 1,
// 					fields: [
// 						{
// 							label: 'Item',
// 							fieldname: 'item',
// 							fieldtype: 'Link',
// 							options: 'Item',
// 							in_list_view: 1,
// 							reqd: 1
// 						},
// 						{
// 							label: 'Qty',
// 							fieldname: 'qty',
// 							fieldtype: 'Int',
// 							default: 1,
// 							in_list_view: 1
// 						}
// 					]
// 				}
// 			],
// 			primary_action_label: __('Create Order'),
// 			primary_action(values) {
// 				if (!values.items || !values.items.length) {
// 					frappe.msgprint('Please add at least one item');
// 					return;
// 				}

// 				frappe.call({
// 					method: "restaurant_management.restaurant_management.customization.api.table_board.create_order",
// 					args: values,
// 					callback: function(r) {
// 						if (r.message) {
// 							frappe.msgprint('Order Created Successfully');
// 							dialog.hide();
// 							load_tables();
// 							frappe.set_route('Form', 'Restaurant Order', r.message);
// 						}
// 					}
// 				});
// 			}
// 		});

// 		dialog.show();
// 	});
// 	function open_add_item_dialog(table_name) {

// 	frappe.call({
// 		method: "restaurant_management.restaurant_management.customization.api.table_board.get_current_order",
// 		args: { table: table_name },
// 		callback(r) {

// 			if (!r.message) {
// 				frappe.msgprint("No active order found");
// 				return;
// 			}

// 			let order_name = r.message;

// 			let dialog = new frappe.ui.Dialog({
// 				title: `Add Item (Table ${table_name})`,
// 				size: "large",
// 				fields: [
// 					{
// 						label: 'Items',
// 						fieldname: 'items',
// 						fieldtype: 'Table',
// 						reqd: 1,
// 						fields: [
// 							{
// 								label: 'Item',
// 								fieldname: 'item',
// 								fieldtype: 'Link',
// 								options: 'Item',
// 								in_list_view: 1,
// 								reqd: 1
// 							},
// 							{
// 								label: 'Qty',
// 								fieldname: 'qty',
// 								fieldtype: 'Int',
// 								default: 1,
// 								in_list_view: 1
// 							}
// 						]
// 					}
// 				],
// 				primary_action_label: "Add Item",
// 				primary_action(values) {
// 					frappe.call({
// 						method: "restaurant_management.restaurant_management.customization.api.table_board.add_items_to_order",
// 						args: {
// 							order_name: order_name,
// 							items: values.items
// 						},
// 						callback() {
// 							frappe.msgprint("Item added to order");
// 							dialog.hide();
// 						}
// 					});
// 				}
// 			});

// 			dialog.show();
// 		}
// 	});
// }


// 	load_tables();
// };
frappe.pages['restaurant-table-lay'].on_page_load = function(wrapper) {
    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Table Occupancy Board',
        single_column: true
    });

    /* ---------------- CSS ---------------- */
    $(`<style>
        .table-card {
            border-radius: 18px;
            padding: 20px;
            color: #fff;
            box-shadow: 0 8px 25px rgba(0,0,0,0.25);
            cursor: pointer;
            position: relative;
            transition: transform 0.35s ease, box-shadow 0.35s ease;
        }

        .table-card:hover {
            transform: translateY(-12px) scale(1.05);
            box-shadow: 0 20px 45px rgba(0,0,0,0.35);
        }

        .status-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            color: white;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .table-card[data-status="Free"] .status-badge {
            background: #2e7d32;
        }
        .table-card[data-status="Reserved"] .status-badge {
            background: #ef6c00;
        }
        .table-card[data-status="Occupied"] .status-badge {
            background: #c62828;
        }

        .table-card h4 {
            margin: 0 0 8px;
            font-weight: 600;
        }

        .table-card p {
            margin: 4px 0;
            font-size: 13px;
        }
    </style>`).appendTo(page.body);

    /* ---------------- FILTERS ---------------- */
    $(`
        <div class="row mb-3" style="align-items:center; gap:10px;">
            <div class="col-md-3">
                <select id="floor-filter" class="form-control form-select">
                    <option value="">All Floors</option>
                </select>
            </div>
            <div class="col-md-3">
                <select id="status-filter" class="form-control form-select">
                    <option value="">All Status</option>
                    <option value="Free">Free</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Occupied">Occupied</option>
                </select>
            </div>
        </div>
    `).appendTo(page.body);

    let container = $('<div class="row g-3 table-board"></div>').appendTo(page.body);

    /* ---------------- LOAD FLOORS ---------------- */
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Restaurant Floor",
            fields: ["name"],
            filters: { is_active: 1 }
        },
        callback(r) {
            (r.message || []).forEach(f => {
                $('#floor-filter').append(`<option value="${f.name}">${f.name}</option>`);
            });
        }
    });

    /* ---------------- LOAD TABLES ---------------- */
    function load_tables() {
        container.empty();

        let filters = { is_active: 1 };
        let floor = $('#floor-filter').val();
        let status = $('#status-filter').val();

        if (floor) filters.floor = floor;
        if (status) filters.status = status;

        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Restaurant Table",
                fields: ["name", "status", "seating_capacity", "floor"],
                filters: filters
            },
            callback(r) {
                (r.message || []).forEach(t => {
                    let gradient = {
                        "Free": "linear-gradient(135deg, #a8e063, #56ab2f)",
                        "Reserved": "linear-gradient(135deg, #ffcc70, #ff6f00)",
                        "Occupied": "linear-gradient(135deg, #ff5858, #b00020)"
                    }[t.status];

                    container.append(`
                        <div class="col-xl-2 col-lg-3 col-md-4 col-sm-6">
                            <div class="table-card"
                                data-name="${t.name}"
                                data-status="${t.status}"
                                style="background:${gradient};">
                                <span class="status-badge">${t.status}</span>
                                <h4>${t.name}</h4>
                                <p>Floor: <b>${t.floor || '-'}</b></p>
                                <p>Seats: <b>${t.seating_capacity}</b></p>
                            </div>
                        </div>
                    `);
                });
            }
        });
    }

    $('#floor-filter, #status-filter').on('change', load_tables);

    /* ---------------- TABLE CLICK ---------------- */
    page.body.on('click', '.table-card', function() {
        let table_name = $(this).data('name');
        let status = $(this).data('status');

        if (status === "Free") {
            open_create_order_dialog(table_name);
        } 
        else if (status === "Occupied") {
            frappe.call({
                method: "restaurant_management.restaurant_management.customization.api.table_board.get_current_order",
                args: { table: table_name },
                callback(r) {
                    if (r.message) {
                        open_existing_order_dialog(table_name);
                    } else {
                        open_create_order_dialog(table_name);
                    }
                }
            });
        } 
        else {
            frappe.msgprint("Table is Reserved");
        }
    });

    /* ---------------- CREATE ORDER ---------------- */
    function open_create_order_dialog(table_name) {
        let dialog = new frappe.ui.Dialog({
            title: "Create Restaurant Order",
            size: "large",
            fields: [
                { label: "Table", fieldname: "table", fieldtype: "Data", read_only: 1, default: table_name },
                { label: "Order Type", fieldname: "order_type", fieldtype: "Select", options: "Dine-In\nTake Away\nDelivery", default: "Dine-In" },
                { label: "Customer", fieldname: "customer", fieldtype: "Link", options: "Customer" },
                { label: "Items", fieldname: "items", fieldtype: "Table", reqd: 1,
                    fields: [
                        { label: "Item", fieldname: "item", fieldtype: "Link", options: "Item", in_list_view: 1, reqd: 1 },
                        { label: "Qty", fieldname: "qty", fieldtype: "Int", default: 1, in_list_view: 1 }
                    ]
                }
            ],
            primary_action_label: "Create Order",
            primary_action(values) {
                frappe.call({
                    method: "restaurant_management.restaurant_management.customization.api.table_board.create_order",
                    args: values,
                    callback() {
                        frappe.msgprint("Order Created");
                        dialog.hide();
                        load_tables();
                    }
                });
            }
        });
        dialog.show();
    }

    /* ---------------- EXISTING ORDER ---------------- */
    function open_existing_order_dialog(table_name) {
        frappe.call({
            method: "restaurant_management.restaurant_management.customization.api.table_board.get_current_order",
            args: { table: table_name },
            callback(r) {
                let doc = r.message;
                if (!doc) {
                    frappe.msgprint("No active order found");
                    return;
                }

                let dialog = new frappe.ui.Dialog({
                    title: `Edit Order (${doc.name})`,
                    size: "large",
                    fields: [
                        { label: "Table", fieldname: "table", fieldtype: "Data", read_only: 1, default: doc.table },
                        { label: "Customer", fieldname: "customer", fieldtype: "Link", options: "Customer", read_only: 1, default: doc.customer },
                        { label: "Existing Items", fieldname: "old_items", fieldtype: "Table", read_only: 1, data: doc.items,
                            fields: [
                                { fieldname: "item", fieldtype: "Data", in_list_view: 1 },
                                { fieldname: "qty", fieldtype: "Int", in_list_view: 1 }
                            ]
                        },
                        { label: "Add New Items", fieldname: "new_items", fieldtype: "Table",
                            fields: [
                                { label: "Item", fieldname: "item", fieldtype: "Link", options: "Item", in_list_view: 1, reqd: 1 },
                                { label: "Qty", fieldname: "qty", fieldtype: "Int", default: 1, in_list_view: 1 }
                            ]
                        }
                    ],
                    primary_action_label: "Update Order",
                    primary_action(values) {
                        if (!values.new_items || !values.new_items.length) {
                            frappe.msgprint("Please add at least one item");
                            return;
                        }
                        frappe.call({
                            method: "restaurant_management.restaurant_management.customization.api.table_board.update_existing_order",
                            args: { order_name: doc.name, items: values.new_items },
                            callback() {
                                frappe.msgprint("Order Updated");
                                dialog.hide();
                                load_tables();
                            }
                        });
                    }
                });
                dialog.show();
            }
        });
    }

    load_tables();
};
