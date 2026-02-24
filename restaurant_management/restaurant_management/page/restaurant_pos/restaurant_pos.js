frappe.pages['restaurant-pos'].on_page_load = function(wrapper) {
    const route = frappe.get_route();
    let table_name = route[1] ? decodeURIComponent(route[1]) : null;

    if (!table_name) {
        frappe.msgprint("Table not found in route");
        return;
    }

    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: `POS - ${table_name}`,
        single_column: true
    });

    // --- State Management ---
    let order_items = {}; 
    let selected_company = null;
    let selected_branch = null;
    let selected_customer = null;
    let order_type = "Dine In";
    let current_order_id = null;
    let reservation_id = null;


    /* ---------------- STYLES ---------------- */
    $(`<style>
        .pos-header { display:flex; gap:12px; margin-bottom:12px; align-items:center; background:#fff; padding:10px; border-radius:10px; box-shadow:0 2px 4px rgba(0,0,0,0.05); }
        .pos-header select { border-radius:8px; border:1px solid #ccc; padding:6px 10px; font-weight:bold; min-width:160px; }
        .pos-layout { display:grid; grid-template-columns:18% 52% 30%; height:calc(100vh - 180px); gap:10px; }
        .pos-left, .pos-center, .pos-right { background:#fff; border-radius:10px; padding:12px; overflow:auto; border:1px solid #e5e7eb; }
        .item-group { padding:12px; cursor:pointer; border-radius:8px; margin-bottom:8px; background:#f1f2f6; font-weight:bold; text-align:center; transition:0.2s; }
        .item-group.active { background:#0984e3; color:#fff; }
        .item-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; }
        .item-card { border:1px solid #dcdde1; border-radius:12px; padding:15px; text-align:center; cursor:pointer; font-weight:bold; background:#fff; transition:0.2s; }
        .order-item { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f1f1f1; align-items:center; }
        .qty-btn { width:28px; height:28px; border:1px solid #ccc; cursor:pointer; border-radius:50%; background:#fff; font-weight:bold; }
        .billing-summary { margin-top:15px; background:#f8f9fa; padding:12px; border-radius:8px; border: 1px dashed #ccc; }
        .grand-total { font-size:22px; font-weight:800; color:#2c3e50; border-top:2px solid #ddd; padding-top:8px; margin-top:8px; }
        .order-id-badge { background: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 10px; display: block; border: 1px solid #ffeeba; }
        .reservation-id-badge {  margin-top: -38px;margin-left: 147px; background: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 10px; display: block; border: 1px solid #ffeeba; }
        .btn-pay { background:#27ae60; color:#fff; padding:12px; border:none; border-radius:8px; font-weight:bold; cursor:pointer; width:100%; }
        .btn-kot { background:#2980b9; color:#fff; padding:12px; border:none; border-radius:8px; font-weight:bold; cursor:pointer; width:100%; }
        .payment-modal { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:none; justify-content:center; align-items:center; z-index:9999; }
        .payment-content { background:#fff; padding:25px; border-radius:15px; width:400px; }
        
    </style>`).appendTo(page.body);
 


    /* ---------------- HTML ---------------- */
    $( `
        <div class="pos-header">
            <select id="company-filter"></select>
            <select id="branch-filter"><option value="">Select Branch</option></select>
            <div id="customer-field" style="min-width: 250px;"></div>
        </div>
        <div class="pos-layout">
            <div class="pos-left"><h5>Categories</h5><div id="group-list"></div></div>
            <div class="pos-center"><h5>Menu Items</h5><div class="item-grid" id="item-list"></div></div>
            <div class="pos-right">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h5 style="font-weight:800; margin:0;">Table: ${table_name}</h5>
                    <div id="order-id-display"></div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div id="reservation-id-display"></div>
                </div>
                <div style="display:flex; gap:20px; align-items:center;">

                <div>
                    <div id="customer-field" style="min-width:250px;"></div>
                    <div id="customer-visit-info"
                         style="font-size:13px; margin-top:6px; font-weight:bold;">
                    </div>
                </div>

            </div>

            <div id="order-area" style="margin-top:30px;">
                <!-- Order items will render here -->
            </div>
                <hr>
                <div id="order-items" style="min-height:200px; max-height:300px; overflow:auto;"></div>
                <div class="billing-summary">
                    <div style="display:flex; justify-content:space-between;"><span>Sub-Total:</span><span id="sub-total">₹ 0.00</span></div>
                    <div style="display:flex; justify-content:space-between; margin-top:5px;"><span>Discount (%):</span><input type="number" id="discount-input" value="0" style="width:60px; text-align:center;"></div>
                    <div style="display:flex; justify-content:space-between; margin-top:5px;">
                    <span>Extra Time Charge:</span>
                    <input type="number" id="extra-charge-input" value="0" 
                    style="width:80px; text-align:center;">
                    </div>
                    <div class="grand-total" style="display:flex; justify-content:space-between;"><span>Total:</span><span id="grand-total">₹ 0.00</span></div>
                </div>
                

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                    <button class="btn-kot" id="kot-btn">SEND KOT</button>
                    <button class="btn-pay" id="checkout-btn">CHECKOUT</button>
                </div>
            </div>
        </div>
        <div class="payment-modal" id="pay-modal">
            <div class="payment-content">
                <h3>Final Payment</h3><hr>
                <label>Payment Mode:</label>
                <select id="pay-mode" style="width:100%; padding:10px; margin-bottom:15px; border-radius:8px;">
                    <option value="Cash">Cash</option><option value="Card">Card</option><option value="UPI">UPI</option>
                </select>
                <div style="display:flex; gap:10px;">
                    <button id="cancel-pay" style="flex:1; padding:10px; border-radius:8px;">Cancel</button>
                    <button id="confirm-pay" style="flex:1; padding:10px; border-radius:8px; background:#27ae60; color:#fff; border:none;">PRINT & BILL</button>
                </div>
            </div>
        </div>
    `).appendTo(page.body);

    /* ---------------- CUSTOMER CONTROL ---------------- */
    let customer_control = frappe.ui.form.make_control({
        parent: $('#customer-field'),
        df: {
            fieldtype: "Link",
            fieldname: "customer",
            options: "Customer",
            placeholder: "Select Customer",
            onchange() {
                selected_customer = customer_control.get_value();
                if (!selected_customer) {
                    $('#customer-visit-info').html("");
                    return;
                }
                load_customer_visit_info(selected_customer);
            }
        },
        render_input: true
    });
    let currency_symbol_map = {};   // { "USD": "$", "INR": "₹" }
    let item_currency_map = {};    // { "ITEM-001": "₹" }
    function get_item_currency_symbol(item_code) {

    // already fetched
    if (item_currency_map[item_code]) {
        return Promise.resolve(item_currency_map[item_code]);
    }

    return frappe.db.get_value(
        "Item Price",
        { item_code: item_code, selling: 1 },
        "currency"
    ).then(r => {
        let currency = r.message?.currency;
        if (!currency) return "";

        // currency ka symbol cache me hai?
        if (currency_symbol_map[currency]) {
            item_currency_map[item_code] = currency_symbol_map[currency];
            return currency_symbol_map[currency];
        }

        // Currency doctype se symbol lao
        return frappe.db.get_value(
            "Currency",
            currency,
            "symbol"
        ).then(c => {
            let symbol = c.message?.symbol || "";
            currency_symbol_map[currency] = symbol;
            item_currency_map[item_code] = symbol;
            return symbol;
        });
    });
}

function load_customer_visit_info(customer) {

    frappe.call({
        method: "restaurant_management.restaurant_management.customization.api.table_board.get_customer_visit_stats",
        args: { customer: customer },
        callback: function(r) {

            if (!r.message) return;

            let monthly = r.message.monthly_visits;
            let lifetime = r.message.lifetime_visits;
            let type = r.message.type;

            let color = "#27ae60";

            if (type === "Platinum") color = "#d4af37";
            else if (type === "VIP") color = "#8e44ad";
            else if (type === "Regular") color = "#2980b9";
            else if (type === "Returning") color = "#f39c12";
            else if (type === "New") color = "#e74c3c";

            $('#customer-visit-info').html(
                `<div style="color:${color}; line-height:1.6;">
                    <div>Monthly Visits: ${monthly}</div>
                    <div>Lifetime Visits: ${lifetime}</div>
                    <div><b>${type} Customer</b></div>
                </div>`
            );
        }
    });
}



    /* ---------------- FUNCTIONS ---------------- */
    function render_order() {
        let subtotal = 0;
        $('#order-items').empty();

        // Order ID
        if (current_order_id) {
            $('#order-id-display').html(
                `<span class="order-id-badge">ID: ${current_order_id}</span>`
            );
        } else {
            $('#order-id-display').empty();
        }

        // Reservation ID
        if (reservation_id) {
            $('#reservation-id-display').html(
                `<span class="reservation-id-badge">ID: ${reservation_id}</span>`
            );
        } else {
            $('#reservation-id-display').empty();
        }

        let items = Object.values(order_items);
        if (!items.length) {
            $('#sub-total').text('');
            $('#grand-total').text('');
            return;
        }

        let promises = [];

        items.forEach(i => {
            let amt = i.qty * i.rate;
            subtotal += amt;

            let diff = i.qty - i.sent_qty;
            let status =
                (i.sent_qty > 0
                    ? `<span style="color:green;font-size:10px;">KOT:${i.sent_qty}</span> `
                    : '') +
                (diff > 0
                    ? `<span style="color:orange;font-size:10px;">New:${diff}</span>`
                    : '');

            let p = get_item_currency_symbol(i.item).then(symbol => {
                $(`<div class="order-item">
                    <div style="flex:1;">
                        <b>${i.item_name}</b><br>${status}

                        <input type="text"
                            placeholder="Kitchen note (Less spicy / Extra spicy)"
                            value="${i.kitchen_note || ''}"
                            style="width:95%; margin-top:4px; padding:4px; font-size:11px; border-radius:6px; border:1px solid #ddd;"
                            oninput="updateKitchenNote('${i.item}', this.value)"
                        />
                    </div>

                    <div style="display:flex; align-items:center; gap:5px;">
                        <button class="qty-btn" onclick="updateQty('${i.item}',-1)">-</button>
                        <span>${i.qty}</span>
                        <button class="qty-btn" onclick="updateQty('${i.item}',1)">+</button>
                    </div>
                    <div style="width:80px; text-align:right;">
                        ${symbol} ${amt.toFixed(2)}
                    </div>
                </div>`).appendTo('#order-items');
            });

            promises.push(p);
        });

        Promise.all(promises).then(() => {
            let disc = parseFloat($('#discount-input').val()) || 0;
            let extra_charge = parseFloat($('#extra-charge-input').val()) || 0;

            let discount_amount = subtotal * disc / 100;

            let total = subtotal - discount_amount + extra_charge;


            // subtotal / total → FIRST item ka symbol use
            let first_symbol = item_currency_map[items[0].item] || "";

            $('#sub-total').text(
                `${first_symbol} ${subtotal.toFixed(2)}`
            );
            $('#grand-total').text(
                `${first_symbol} ${total.toFixed(2)}`
            );

        });
    }


        window.updateQty = (code, val) => {
            let itm = order_items[code];
            if (itm.qty + val < itm.sent_qty) return frappe.show_alert("KOT items can't be reduced", "orange");
            itm.qty += val;
            if (itm.qty <= 0) delete order_items[code];
            render_order();
        };
        window.updateKitchenNote = (code, note) => {
            if (order_items[code]) {
                order_items[code].kitchen_note = note;
            }
        };

    function set_currency_from_item_price(item_code) {
        // agar already set hai to dobara mat lao
        if (current_currency_symbol) return Promise.resolve();

        return frappe.db.get_value(
            "Item Price",
            { item_code: item_code, selling: 1 },
            "currency"
        ).then(r => {
            current_currency = r.message?.currency;
            if (!current_currency) return;

            return frappe.db.get_value(
                "Currency",
                current_currency,
                "symbol"
            );
        }).then(r => {
            if (r?.message?.symbol) {
                current_currency_symbol = r.message.symbol;
            }
        });
    }


    function add_item(item) {
        if (!order_items[item.name]) {
            order_items[item.name] = { item: item.name, item_name: item.item_name, qty: 1, sent_qty: 0, rate: item.standard_rate,kitchen_note: "" };
        } else { order_items[item.name].qty += 1; }
        render_order();
    }
    

    function load_existing_order() {
        frappe.call({
            method: "restaurant_management.restaurant_management.customization.api.table_board.get_current_order",
            args: { table: table_name },
            callback: (r) => {
                console.log("get_current_order response", r.message);

                order_items = {};
                current_order_id = null;
                reservation_id = null;

                if (r.message) {

                    // 🔥 SAFE ORDER ID RESOLUTION
                    current_order_id = r.message.name || r.message.order || r.message.order_id || null;
                    reservation_id = r.message.reservation || r.message.current_reservation || null;
                    selected_company = r.message.company;
                    selected_branch = r.message.restaurant_branch;
                    selected_customer = r.message.customer;
                    
                    $('#company-filter').val(selected_company);
                    load_branches(selected_company, () => {
                        $('#branch-filter').val(selected_branch);
                    });

                    frappe.call({
                        method: "frappe.client.get_list",
                        args: {
                            doctype: "Branch",
                            fields: ["name"],
                            filters: { custom_company: selected_company }
                        },
                        callback(res) {
                            $('#branch-filter').html('<option value="">Select Branch</option>');
                            res.message.forEach(b => {
                                $('#branch-filter').append(`<option>${b.name}</option>`);
                            });
                            $('#branch-filter').val(selected_branch);
                        }
                    });

                    if (selected_customer) {
                        customer_control.set_value(selected_customer);
                        load_customer_visit_info(selected_customer);
                    }
                    // 🔥 ITEMS RESOLUTION
                    let items =
                        r.message.items ||
                        r.message.order_items ||
                        [];

                    items.forEach(i => {
                        order_items[i.item] = {
                            item: i.item,
                            item_name: i.item_name,
                            qty: i.qty,
                            sent_qty: i.qty,
                            rate: i.rate,
                            kitchen_note: i.kitchen_note
                        };
                    });
                }

                render_order();
            }
        });
    }
    function load_branches(company, callback=null) {
        $('#branch-filter').html('<option value="">Select Branch</option>');

        if (!company) return;

        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Branch",
                fields: ["name"],
                filters: { custom_company: company }   // ✅ tumhari custom field
            },
            callback(res) {
                (res.message || []).forEach(b => {
                    $('#branch-filter').append(
                        `<option value="${b.name}">${b.name}</option>`
                    );
                });

                if (callback) callback();
            }
        });
    }



    /* ---------------- ACTIONS ---------------- */
    $('#kot-btn').on('click', () => {
        let send = [];
        Object.values(order_items).forEach(i => { if (i.qty > i.sent_qty) send.push({item: i.item, qty: i.qty - i.sent_qty, kitchen_note: i.kitchen_note || ""}); });
        if (!send.length) return frappe.msgprint("No new items");
        frappe.call({
            method: "restaurant_management.restaurant_management.customization.api.table_board.create_order",
            args: { 
                table: table_name, 
                items: send, 
                company: selected_company, 
                branch: selected_branch, 
                order_type: order_type, 
                customer: selected_customer 
            },
            callback: (r) => {
                frappe.show_alert("KOT Sent", "green"); 
                load_existing_order(); // This will refresh current_order_id
            }
        });
    });

    $('#confirm-pay').on('click', () => {
        frappe.call({
            method: "restaurant_management.restaurant_management.customization.api.table_board.finalize_bill",
            args: {
                table: table_name,
                discount: $('#discount-input').val(),
                extra_charge: $('#extra-charge-input').val(),
                payment_mode: $('#pay-mode').val(),
                company: selected_company,
                customer: selected_customer
            },
            callback: (r) => {
                if (r.message) {
                    frappe.show_alert("Invoice Created Successfully", "green");
                    // Clear LocalStorage Customer on complete
                    localStorage.removeItem('pos_customer');
                    window.open(`/app/print/Sales Invoice/${r.message.invoice_id}`, '_blank');
                    frappe.set_route('restaurant-table-lay');
                }
            }
        });
    });

    /* ---------------- INITIALIZATION ---------------- */
    
    // Load Companies
     frappe.call({
        method: "frappe.client.get_list",
        args: { doctype: "Company", fields: ["name"] },
        callback(r) {
            r.message.forEach(c => {
                $('#company-filter').append(`<option>${c.name}</option>`);
            });
            $('#company-filter').val(selected_company);
        }
    });

    $('#company-filter').on('change', function () {
        selected_company = $(this).val();
        selected_branch = null;
        load_branches(selected_company);
    });


    $('#branch-filter').on('change', function () {
        selected_branch = $(this).val();
    });
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Item",
            fields: ["custom_menu_category"],
            filters: {
                disabled: 0,
                custom_is_menu_item: 1,
                custom_menu_category: ["is", "set"]
            },
            limit_page_length: 0
        },
        callback: (r) => {

            let categories = [...new Set(
                (r.message || [])
                    .map(row => row.custom_menu_category)
                    .filter(Boolean)
            )];

            $('#group-list').empty();

            categories.forEach((cat, index) => {

                let btn = $(`<div class="item-group ${index === 0 ? 'active' : ''}">
                    ${cat}
                </div>`);

                btn.appendTo('#group-list');

                btn.on('click', function () {
                    $('.item-group').removeClass('active');
                    $(this).addClass('active');
                    load_items_by_group(cat);
                });

                // First category auto load
                if (index === 0) {
                    load_items_by_group(cat);
                }
            });
        }
    });


    function load_items_by_group(category) {
        $('#item-list').empty();
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Item",
                fields: ["name", "item_name", "standard_rate"],
                filters: { custom_menu_category: category , disabled: 0, custom_is_menu_item: 1 }
            },
            callback: (res) => {
                res.message.forEach(i => {

                    frappe.db.get_value(
                        "Item Price",
                        { item_code: i.name, selling: 1 },
                        ["currency", "price_list_rate"]
                    ).then(priceRes => {

                        let currency = priceRes.message?.currency;
                        let rate = priceRes.message?.price_list_rate || i.standard_rate;

                        if (!currency) currency = "INR";

                        frappe.db.get_value(
                            "Currency",
                            currency,
                            "symbol"
                        ).then(currencyRes => {

                            let symbol = currencyRes.message?.symbol || "₹";

                            console.log(symbol, "✅ currency symbol");

                            $(`<div class="item-card">
                                ${i.item_name}<br>
                                ${symbol} ${rate}
                            </div>`)
                            .appendTo('#item-list')
                            .on('click', () => add_item(i));
                        });

                    });
                });
            }

        });
    }

    $('#checkout-btn').on('click', () => { if (Object.keys(order_items).length) $('#pay-modal').css('display', 'flex'); });
    $('#cancel-pay').on('click', () => $('#pay-modal').hide());
    $('#discount-input').on('input', render_order);
    $('#extra-charge-input').off('input').on('input', render_order);
    load_existing_order();
};
