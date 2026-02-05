// frappe.pages['waiter-orders'].on_page_load = function(wrapper) {

//     let page = frappe.ui.make_app_page({
//         parent: wrapper,
//         title: 'Waiter – Ready to Serve',
//         single_column: true
//     });

//     /* ---------------- CSS ---------------- */
//     $(`
//     <style>
//         .waiter-grid {
//             display: grid;
//             grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
//             gap: 15px;
//             padding: 15px;
//         }

//         .order-card {
//             border: 1px solid #e5e7eb;
//             border-radius: 12px;
//             box-shadow: 0 4px 6px rgba(0,0,0,.05);
//             background: #fff;
//         }

//         .order-header {
//             background: #6c5ce7;
//             color: white;
//             padding: 12px;
//             border-radius: 12px 12px 0 0;
//             font-weight: bold;
//             display: flex;
//             justify-content: space-between;
//         }

//         .order-body {
//             padding: 15px;
//         }

//         .waiter-item {
//             display: flex;
//             justify-content: space-between;
//             padding: 8px 0;
//             border-bottom: 1px dashed #ddd;
//             font-weight: 600;
//         }

//         .serve-btn {
//             width: 100%;
//             background: #00b894;
//             border: none;
//             color: white;
//             padding: 10px;
//             border-radius: 8px;
//             font-weight: bold;
//             cursor: pointer;
//             margin-top: 12px;
//         }

//         .table-label {
//             font-size: 13px;
//             color: #636e72;
//             margin-bottom: 10px;
//             display: block;
//         }
//     </style>
//     `).appendTo(page.body);

//     const grid = $('<div class="waiter-grid"></div>').appendTo(page.body);

//     page.load_waiter_orders = function() {
//         frappe.call({
//             method: "restaurant_management.restaurant_management.doctype.restaurant_order.restaurant_order.get_waiter_orders",
//             callback(r) {
//                 grid.empty();

//                 if (!r.message || r.message.length === 0) {
//                     grid.append(`<div style="grid-column:1/-1;text-align:center;color:#aaa;padding:80px;">
//                         <h3>No Food Ready</h3>
//                     </div>`);
//                     return;
//                 }

//                 r.message.forEach(order => {

//                     let card = $(`
//                         <div class="order-card">
//                             <div class="order-header">
//                                 <span>Table ${order.table}</span>
//                                 <span>${order.name}</span>
//                             </div>
//                             <div class="order-body">
//                                 <span class="table-label">Ready Items</span>
//                                 <div class="items"></div>
//                                 <button class="serve-btn">MARK AS SERVED</button>
//                             </div>
//                         </div>
//                     `);

//                     order.items.forEach(it => {
//                         card.find('.items').append(`
//                             <div class="waiter-item">
//                                 <span>${it.item_name}</span>
//                                 <span>x${it.qty}</span>
//                             </div>
//                         `);
//                     });

//                     card.find('.serve-btn').on('click', () => {

//                         let calls = order.items.map(i => {
//                             return frappe.call({
//                                 method: "restaurant_management.restaurant_management.doctype.restaurant_order.restaurant_order.mark_item_served",
//                                 args: { row_name: i.row_name }
//                             });
//                         });

//                         Promise.all(calls).then(() => {
//                             frappe.show_alert({
//                                 message: "Items Served",
//                                 indicator: "green"
//                             });
//                             card.fadeOut(300, () => page.load_waiter_orders());
//                         });
//                     });

//                     grid.append(card);
//                 });
//             }
//         });
//     };

//     page.load_waiter_orders();
//     setInterval(() => page.load_waiter_orders(), 8000);
// };

frappe.pages['waiter-orders'].on_page_load = function(wrapper) {

    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Waiter – Ready to Serve',
        single_column: true
    });

    /* ---------------- UPDATED CSS ---------------- */
    $(`
    <style>
        .waiter-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }

        .order-card {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,.08);
            background: #fff;
            display: flex;
            flex-direction: column;
            height: 300px; /* Fixed Height for alignment */
            overflow: hidden;
            transition: 0.2s;
        }

        .order-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 15px rgba(0,0,0,.12);
        }

        .order-header {
            background: #0984e3;;
            color: white;
            padding: 12px 15px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            flex-shrink: 0;
        }

        .order-body {
            padding: 15px;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            overflow: hidden; /* Prevent body from expanding */
        }

        .table-label {
            font-size: 12px;
            color: #636e72;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
            flex-shrink: 0;
        }

        .items-container {
            flex-grow: 1;
            overflow-y: auto; /* Internal scroll if items are many */
            padding-right: 5px;
        }

        /* Better Scrollbar */
        .items-container::-webkit-scrollbar { width: 4px; }
        .items-container::-webkit-scrollbar-thumb { background: #dfe6e9; border-radius: 10px; }

        .waiter-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed #f1f1f1;
            font-weight: 600;
            color: #2d3436;
        }

        .qty-badge {
            background: #f1f2f6;
            color:#0984e3;
            padding: 2px 8px;
            border-radius: 5px;
            font-size: 13px;
        }

        .serve-btn {
            width: 100%;
            background: #219150;
            border: none;
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 12px;
            font-size: 14px;
            flex-shrink: 0; /* Button always at bottom */
            transition: 0.2s;
        }

        .serve-btn:hover {
            background: #219150;
        }
    </style>
    `).appendTo(page.body);

    const grid = $('<div class="waiter-grid"></div>').appendTo(page.body);

    page.load_waiter_orders = function() {
        frappe.call({
            method: "restaurant_management.restaurant_management.doctype.restaurant_order.restaurant_order.get_waiter_orders",
            callback(r) {
                grid.empty();

                if (!r.message || r.message.length === 0) {
                    grid.append(`<div style="grid-column:1/-1;text-align:center;color:#aaa;padding:100px;">
                        <i class="fa fa-check-circle" style="font-size: 40px; margin-bottom: 10px; color: #eee;"></i>
                        <h3>All items served!</h3>
                    </div>`);
                    return;
                }

                r.message.forEach(order => {
                    let card = $(`
                        <div class="order-card">
                            <div class="order-header">
                                <span>Table ${order.table}</span>
                                <span style="font-size: 12px; opacity: 0.8;">${order.name}</span>
                            </div>
                            <div class="order-body">
                                <span class="table-label">Ready to Serve</span>
                                <div class="items-container"></div>
                                <button class="serve-btn">MARK AS SERVED</button>
                            </div>
                        </div>
                    `);

                    order.items.forEach(it => {
                        card.find('.items-container').append(`
                            <div class="waiter-item">
                                <span>${it.item_name}</span>
                                <span class="qty-badge">x${it.qty}</span>
                            </div>
                        `);
                    });

                    card.find('.serve-btn').on('click', function() {
                        let $btn = $(this);
                        $btn.prop('disabled', true).text('Serving...');

                        let calls = order.items.map(i => {
                            return frappe.call({
                                method: "restaurant_management.restaurant_management.doctype.restaurant_order.restaurant_order.mark_item_served",
                                args: { row_name: i.row_name }
                            });
                        });

                        Promise.all(calls).then(() => {
                            frappe.show_alert({
                                message: `Table ${order.table} items served`,
                                indicator: "green"
                            });
                            card.fadeOut(300, () => page.load_waiter_orders());
                        });
                    });

                    grid.append(card);
                });
            }
        });
    };

    page.load_waiter_orders();
    
    // Refresh interval set to 8 seconds
    let refresh_interval = setInterval(() => page.load_waiter_orders(), 8000);
    
    // Clear interval when leaving page to save resources
    $(window).on('hashchange', () => clearInterval(refresh_interval));
};