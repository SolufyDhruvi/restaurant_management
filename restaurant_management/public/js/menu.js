// frappe.ready(function () {
//     console.log("MENU JS LOADED");

//     const params = new URLSearchParams(window.location.search);
//     const table_no = params.get("table");

//     if (!table_no) {
//         frappe.msgprint("Table not found in URL. Please scan the QR again.");
//         return;
//     }

//     // --- Styles Integration ---
//     let style = `
//     <style>
//         .menu-card {
//             cursor: pointer;
//             -webkit-tap-highlight-color: transparent; /* Mobile ke liye */
//         }
//         #menu-container { padding: 15px; min-height: 100vh; }
        
//         #menuSearch { 
//             width: 100%; padding: 12px 15px; border-radius: 10px; 
//             border: 1px solid #ddd; margin-bottom: 20px; font-size: 16px;
//             box-shadow: 0 2px 5px rgba(0,0,0,0.05);
//         }

//         .category-tabs { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
//         .category-tab { 
//             padding: 8px 18px; border-radius: 20px; cursor: pointer; 
//             background: #fff; border: 1px solid #ddd; transition: 0.3s;
//             font-weight: 500; color: #555;
//         }
//         .category-tab.active { background: #27ae60; color: #fff; border-color: #27ae60; }

//         .veg-filter { margin-bottom: 20px; display: flex; gap: 8px; }
//         .veg-btn {
//             padding: 6px 15px; border-radius: 8px; border: 1px solid #ddd;
//             background: #fff; cursor: pointer; transition: 0.2s; font-size: 13px;
//         }
//         .veg-btn.active[data-type="Veg"] { background: #27ae60; color: #fff; border-color: #27ae60; }
//         .veg-btn.active[data-type="Non Veg"] { background: #e74c3c; color: #fff; border-color: #e74c3c; }
//         .veg-btn.active[data-type="All"] { background: #34495e; color: #fff; border-color: #34495e; }

//         .menu-grid {
//             display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
//             gap: 15px;
//         }

//         .menu-card {
//             background: #fff; border-radius: 15px; overflow: hidden;
//             box-shadow: 0 4px 12px rgba(0,0,0,0.08); cursor: pointer;
//             transition: 0.3s; position: relative; border: 1px solid #eee;
//         }
//         .menu-card:hover { transform: translateY(-3px); box-shadow: 0 6px 15px rgba(0,0,0,0.12); }

//         .menu-img { width: 100%; height: 120px; object-fit: cover; }

//         .menu-body { padding: 12px; text-align: center; }
//         .menu-body h5 { font-size: 14px; margin: 0 0 5px; color: #333; font-weight: 600; }
//         .price { color: #27ae60; font-weight: bold; font-size: 15px; }

//         .veg-nonveg-box { 
//             position: absolute; top: 10px; right: 10px; 
//             width: 18px; height: 18px; background: #fff;
//             border: 1px solid #ccc; display: flex; align-items: center; justify-content:center;
//             z-index: 10;
//         }
//         .dot { width: 10px; height: 10px; border-radius: 50%; }
//         .dot-Veg { background: #27ae60; }
//         .dot-NonVeg { background: #e74c3c; }
//     </style>`;

//     // --- Layout Setup ---
//     $("#menu").html(`
//         ${style}
//         <div id="menu-container">
//             <input type="text" id="menuSearch" placeholder="Search for dishes...">
//             <div class="category-tabs" id="category-tabs"></div>
//             <div class="veg-filter">
//                 <button class="veg-btn active" data-type="All">All</button>
//                 <button class="veg-btn" data-type="Veg">Veg</button>
//                 <button class="veg-btn" data-type="Non Veg">Non Veg</button>
//             </div>
//             <div id="menu-display-area" class="menu-grid"></div>
//         </div>
//     `);

//     let all_items = [];
//     let current_category = "All";
//     let current_type = "All";

//     load_menu();

//     function load_menu() {
//         frappe.call({
//             method: "frappe.client.get_list",
//             args: {
//                 doctype: "Item",
//                 fields: ["name", "item_name", "standard_rate", "image", "custom_menu_category", "custom_food_type"],
//                 filters: { disabled: 0, custom_is_menu_item: 1 },
//                 limit_page_length: 500
//             },
//             callback(r) {
//                 if (r.message) {
//                     all_items = r.message;
//                     render_tabs();
//                     render_items();
//                 }
//             }
//         });
//     }

//     function render_tabs() {
//         const categories = ["All", ...new Set(all_items.map(i => i.custom_menu_category))].filter(Boolean);
//         let tabs_html = "";
//         categories.forEach(cat => {
//             tabs_html += `<div class="category-tab ${cat === current_category ? 'active' : ''}" data-category="${cat}">${cat}</div>`;
//         });
//         $("#category-tabs").html(tabs_html);
//     }

//     function render_items(filtered_data = null) {
//         let items_to_show = filtered_data || all_items;

//         if (current_category !== "All") {
//             items_to_show = items_to_show.filter(i => i.custom_menu_category === current_category);
//         }

//         if (current_type !== "All") {
//             items_to_show = items_to_show.filter(i => i.custom_food_type === current_type);
//         }

//         let html = "";
//         items_to_show.forEach(item => {
//             let dot_class = item.custom_food_type === "Non Veg" ? "dot-NonVeg" : "dot-Veg";
//             let img = item.image || '/assets/frappe/images/default.png';

//             html += `
//                 <div class="menu-card" data-item="${item.name}">
//                     <div class="veg-nonveg-box">
//                         <div class="dot ${dot_class}"></div>
//                     </div>
//                     <img src="${img}" class="menu-img">
//                     <div class="menu-body">
//                         <h5>${item.item_name}</h5>
//                         <div class="price">₹ ${item.standard_rate}</div>
//                     </div>
//                 </div>`;
//         });

//         $("#menu-display-area").html(html || "<p style='grid-column: 1/-1; text-align:center; padding: 20px;'>No items found.</p>");
//     }

//     // --- Listeners ---
//     $(document).on("input", "#menuSearch", function () {
//         const val = $(this).val().toLowerCase();
//         const search_results = all_items.filter(i => 
//             (i.item_name && i.item_name.toLowerCase().includes(val))
//         );
//         render_items(search_results);
//     });

//     $(document).on("click", ".category-tab", function () {
//         $(".category-tab").removeClass("active");
//         $(this).addClass("active");
//         current_category = $(this).data("category");
//         render_items();
//     });

//     $(document).on("click", ".veg-btn", function () {
//         $(".veg-btn").removeClass("active");
//         $(this).addClass("active");
//         current_type = $(this).data("type");
//         render_items();
//     });

//     $(document).on("click", ".menu-card", function () {
//         const item_code = $(this).data("item");
//         open_modal(item_code);
//     });

//     function open_modal(item_code) {
//         $("#orderModal").remove();
//         $('.modal-backdrop').remove();

//         frappe.call({
//             method: "frappe.client.get",
//             args: { doctype: "Item", name: item_code },
//             callback(r) {
//                 const item = r.message;
//                 if (!item) return;

//                 let modal_html = `
//                 <div class="modal fade" id="orderModal" tabindex="-1">
//                   <div class="modal-dialog modal-dialog-centered">
//                     <div class="modal-content" style="border-radius: 20px; overflow: hidden;">
//                       <div class="modal-header" style="background: #f8f9fa;">
//                         <h5 class="modal-title">Add to Order</h5>
//                         <button type="button" class="close" data-dismiss="modal">&times;</button>
//                       </div>
//                       <div class="modal-body">
//                         <div class="text-center mb-3">
//                             <img src="${item.image || '/assets/frappe/images/default.png'}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 10px;">
//                             <h4 class="mt-2">${item.item_name}</h4>
//                             <p class="text-success font-weight-bold">₹ ${item.standard_rate}</p>
//                         </div>
                        
//                         <div class="form-group">
//                             <label style="font-weight:600;">Table Number</label>
//                             <input type="text" class="form-control" value="${table_no}" readonly style="background:#f1f1f1;">
//                         </div>

//                         <div class="form-group">
//                             <label style="font-weight:600;">Customer Name</label>
//                             <input type="text" id="customer_name" class="form-control" placeholder="Enter guest name (Optional)">
//                         </div>

//                         <div class="row">
//                             <div class="col-6">
//                                 <div class="form-group">
//                                     <label style="font-weight:600;">Quantity</label>
//                                     <input type="number" id="qty" class="form-control" value="1" min="1">
//                                 </div>
//                             </div>
//                             <div class="col-6">
//                                 <label style="font-weight:600;">Type</label>
//                                 <div class="pt-2">${item.custom_food_type || 'N/A'}</div>
//                             </div>
//                         </div>

//                         <div class="form-group">
//                             <label style="font-weight:600;">Kitchen Note</label>
//                             <textarea id="note" class="form-control" rows="2" placeholder="E.g. No onions, make it spicy"></textarea>
//                         </div>
//                       </div>
//                       <div class="modal-footer">
//                         <button type="button" class="btn btn-primary btn-block" id="submitOrder" style="background:#27ae60; border:none; height: 48px; font-size: 16px; font-weight:600;">Confirm Add</button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>`;

//                 $("body").append(modal_html);
//                 $("#orderModal").modal("show");

//                 $("#submitOrder").on("click", function () {
//                     const btn = $(this);
//                     btn.prop('disabled', true).text('Processing...');

//                     frappe.call({
//                         method: "restaurant_management.restaurant_management.customization.api.table_board.create_order",
//                         args: {
//                             table: table_no,
//                             customer: $("#customer_name").val(), // Passing customer name here
//                             items: JSON.stringify([{
//                                 item: item_code,
//                                 qty: $("#qty").val(),
//                                 kitchen_note: $("#note").val()
//                             }])
//                         },
//                         callback(r) {
//                             if (!r.exc) {
//                                 frappe.show_alert({message: `Order for ${item.item_name} added!`, indicator: 'green'});
//                                 $("#orderModal").modal("hide");
//                             }
//                             btn.prop('disabled', false).text('Confirm Add');
//                         }
//                     });
//                 });
//             }
//         });
//     }
// });
frappe.ready(function () {
    console.log("MENU JS LOADED");

    const params = new URLSearchParams(window.location.search);
    const table_no = params.get("table");

    if (!table_no) {
        frappe.msgprint("Table not found in URL. Please scan the QR again.");
        return;
    }

    // --- Styles Integration ---
    let style = `
    <style>
        #menu-container { padding: 15px; min-height: 100vh; font-family: sans-serif; }
        #menuSearch { width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid #ddd; margin-bottom: 20px; font-size: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);}
        .category-tabs { display: flex; gap: 10px; margin-bottom: 20px; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 5px; }
        .category-tab { padding: 8px 18px; border-radius: 20px; cursor: pointer; white-space: nowrap; background: #fff; border: 1px solid #ddd; transition: 0.3s; font-weight: 500; color: #555; }
        .category-tab.active { background: #27ae60; color: #fff; border-color: #27ae60; }
        .veg-filter { margin-bottom: 20px; display: flex; gap: 8px; }
        .veg-btn { padding: 6px 15px; border-radius: 8px; border: 1px solid #ddd; background: #fff; cursor: pointer; transition: 0.2s; font-size: 13px; }
        .veg-btn.active[data-type="Veg"] { background: #27ae60; color: #fff; border-color: #27ae60; }
        .veg-btn.active[data-type="Non Veg"] { background: #e74c3c; color: #fff; border-color: #e74c3c; }
        .veg-btn.active[data-type="All"] { background: #34495e; color: #fff; border-color: #34495e; }
        .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; }
        .menu-card { background: #fff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); cursor: pointer; transition: 0.3s; position: relative; border: 1px solid #eee; }
        .menu-img { width: 100%; height: 120px; object-fit: cover; }
        .menu-body { padding: 12px; text-align: center; }
        .menu-body h5 { font-size: 14px; margin: 0 0 5px; color: #333; font-weight: 600; }
        .price { color: #27ae60; font-weight: bold; font-size: 15px; }
        .veg-nonveg-box { position: absolute; top: 10px; right: 10px; width: 18px; height: 18px; background: #fff; border: 1px solid #ccc; display: flex; align-items: center; justify-content:center; z-index: 10; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-Veg { background: #27ae60; }
        .dot-NonVeg { background: #e74c3c; }
    </style>`;

    // --- Layout Setup ---
    $("#menu").html(`
        ${style}
        <div id="menu-container">
            <input type="text" id="menuSearch" placeholder="Search for dishes...">
            <div class="category-tabs" id="category-tabs"></div>
            <div class="veg-filter">
                <button class="veg-btn active" data-type="All">All</button>
                <button class="veg-btn" data-type="Veg">Veg</button>
                <button class="veg-btn" data-type="Non Veg">Non Veg</button>
            </div>
            <div id="menu-display-area" class="menu-grid"></div>
        </div>
    `);

    let all_items_list = [];
    let current_category = "All";
    let current_type = "All";

    load_menu();

    function load_menu() {
        frappe.call({
            method: "restaurant_management.restaurant_management.customization.item.item.get_menu_items",
            callback(r) {
                if (r.message) {
                    all_items_list = [];
                    if (!Array.isArray(r.message)) {
                        Object.keys(r.message).forEach(cat => {
                            r.message[cat].forEach(item => {
                                item.custom_menu_category = cat;
                                all_items_list.push(item);
                            });
                        });
                    } else {
                        all_items_list = r.message;
                    }
                    render_tabs();
                    render_items();
                }
            }
        });
    }

    function render_tabs() {
        const categories = ["All", ...new Set(all_items_list.map(i => i.custom_menu_category))].filter(Boolean);
        let tabs_html = "";
        categories.forEach(cat => {
            tabs_html += `<div class="category-tab ${cat === current_category ? 'active' : ''}" data-category="${cat}">${cat}</div>`;
        });
        $("#category-tabs").html(tabs_html);
    }

    function render_items(filtered_data = null) {
        let items_to_show = filtered_data || all_items_list;

        if (current_category !== "All") items_to_show = items_to_show.filter(i => i.custom_menu_category === current_category);
        if (current_type !== "All") items_to_show = items_to_show.filter(i => i.custom_food_type === current_type);

        let html = "";
        items_to_show.forEach(item => {
            let dot_class = item.custom_food_type === "Non Veg" ? "dot-NonVeg" : "dot-Veg";
            let img = item.image || '/assets/frappe/images/default.png';

            html += `
                <div class="menu-card" data-item="${item.name}">
                    <div class="veg-nonveg-box">
                        <div class="dot ${dot_class}"></div>
                    </div>
                    <img src="${img}" class="menu-img">
                    <div class="menu-body">
                        <h5>${item.item_name}</h5>
                        <div class="price">₹ ${item.standard_rate}</div>
                    </div>
                </div>`;
        });

        $("#menu-display-area").html(html || "<p style='grid-column: 1/-1; text-align:center; padding: 20px;'>No items found.</p>");
    }

    // --- Listeners ---
    $(document).on("input", "#menuSearch", function () {
        const val = $(this).val().toLowerCase();
        const search_results = all_items_list.filter(i => i.item_name && i.item_name.toLowerCase().includes(val));
        render_items(search_results);
    });

    $(document).on("click", ".category-tab", function () {
        $(".category-tab").removeClass("active");
        $(this).addClass("active");
        current_category = $(this).data("category");
        render_items();
    });

    $(document).on("click", ".veg-btn", function () {
        $(".veg-btn").removeClass("active");
        $(this).addClass("active");
        current_type = $(this).data("type");
        render_items();
    });

    $(document).on("click", ".menu-card", function () {
        const item_code = $(this).data("item");
        const item = all_items_list.find(i => i.name === item_code);
        if (item) open_modal(item);
    });

    // --- Modal & Customer Creation + Order ---
    function open_modal(item) {
        $("#orderModal").remove();
        $('.modal-backdrop').remove();

        let modal_html = `
        <div class="modal fade" id="orderModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content" style="border-radius: 20px; overflow: hidden;">
                <div class="modal-header" style="background: #f8f9fa; border-bottom: none;">
                <h5 class="modal-title">Add to Order</h5>
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-3">
                        <img src="${item.image || '/assets/frappe/images/default.png'}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 10px;">
                        <h4 class="mt-2">${item.item_name}</h4>
                        <p class="text-success font-weight-bold">₹ ${item.standard_rate}</p>
                    </div>

                    <div class="form-group">
                        <label style="font-weight:600;">Table Number</label>
                        <input type="text" class="form-control" value="${table_no}" readonly style="background:#f1f1f1;">
                    </div>

                    <div class="form-group">
                        <label style="font-weight:600;">Customer Name</label>
                        <input type="text" id="customer_name" class="form-control" placeholder="Enter guest name">
                    </div>

                    <div class="row">
                        <div class="col-6">
                            <div class="form-group">
                                <label style="font-weight:600;">Quantity</label>
                                <input type="number" id="qty" class="form-control" value="1" min="1">
                            </div>
                        </div>
                        <div class="col-6">
                            <label style="font-weight:600;">Type</label>
                            <div class="pt-2">${item.custom_food_type || 'N/A'}</div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label style="font-weight:600;">Kitchen Note</label>
                        <textarea id="note" class="form-control" rows="2" placeholder="E.g. No spicy"></textarea>
                    </div>
                </div>
                <div class="modal-footer" style="border-top: none;">
                    <button type="button" class="btn btn-primary btn-block" id="submitOrder" style="background:#27ae60; border:none; height: 48px; font-size: 16px; font-weight:600;">Confirm Add</button>
                </div>
            </div>
            </div>
        </div>`;

        $("body").append(modal_html);
        $("#orderModal").modal("show");

        $("#submitOrder").off("click").on("click", function () {
            const btn = $(this);
            btn.prop('disabled', true).text('Processing...');
            const customer_name_val = $("#customer_name").val().trim();
            if (!customer_name_val) { frappe.msgprint("Enter customer name"); btn.prop('disabled', false).text('Confirm Add'); return; }

            // Use guest-safe API to create or get customer
            frappe.call({
                method: "restaurant_management.restaurant_management.customization.api.table_board.create_customer",
                args: { name: customer_name_val },
                callback(r2) {
                    if (r2.message) {
                        frappe.show_alert({message:`Customer ${customer_name_val} ready!`, indicator:'blue'});

                        // Then create order
                        frappe.call({
                            method: "restaurant_management.restaurant_management.customization.api.table_board.create_order",
                            args: {
                                table: table_no,
                                customer: r2.message,
                                items: JSON.stringify([{
                                    item: item.name,
                                    qty: $("#qty").val(),
                                    kitchen_note: $("#note").val()
                                }])
                            },
                            callback(r3) {
                                if (!r3.exc) {
                                    frappe.show_alert({message:`Order Sent!`, indicator:'green'});
                                    $("#orderModal").modal("hide");
                                }
                                btn.prop('disabled', false).text('Confirm Add');
                            },
                            error(r3) { btn.prop('disabled', false).text('Confirm Add'); console.error(r3); }
                        });
                    } else {
                        frappe.msgprint("Failed to create customer.");
                        btn.prop('disabled', false).text('Confirm Add');
                    }
                },
                error(err) { btn.prop('disabled', false).text('Confirm Add'); console.error(err); }
            });
        });
    }
});
