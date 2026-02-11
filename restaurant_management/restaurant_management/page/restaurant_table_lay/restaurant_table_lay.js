frappe.pages['restaurant-table-lay'].on_page_load = function (wrapper) {

    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Restaurant Floor Plan',
        single_column: true
    });
    setInterval(() => {
        load_tables_by_floor(); // OR location.reload();
    }, 15000);

    page.add_menu_item('Add Table', () => {
        open_table_dialog();
    });

    /* ---------------- CSS ---------------- */
    $(`<style>
        .cancel-icon {
            position: absolute;
            top: 1px;
            left: 33px;
            cursor: pointer;
            color: #e74c3c;
            font-size: 10px;
        }

        .floor-wrapper {
            display: grid;
            grid-template-columns: 3fr 1.5fr;
            gap: 25px;
            margin-bottom: 40px;
        }
        .floor-section { margin-bottom: 40px; }
        .floor-header {
            font-size: 1.3rem;
            font-weight: bold;
            margin-bottom: 20px;
            border-bottom: 2px solid #edeff0;
        }
        .table-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 20px;
        }
        .table-card {
            background: #fff;
            border-radius: 12px;
            padding: 18px;
            text-align: center;
            border: 1px solid #d1d8dd;
            position: relative;
            cursor: pointer;
            min-height: 140px;
            transition: 0.2s;
        }
        .table-card:hover { transform: translateY(-5px); }

        .status-Free { border-top: 8px solid #2ecc71; }
        .status-Occupied { border-top: 8px solid #e74c3c; background:#fff9f9; }
        .status-Reserved { border-top: 8px solid #f39c12; background:#fffaf0; }

        .table-name { font-size: 22px; font-weight: 800; }
        .tab-info { font-size: 12px; color: #636e72; }

        .table-amount {
            font-size: 15px;
            font-weight: bold;
            color: #d63031;
            margin-top: 8px;
            display: block;
        }

        .reserve-icon {
            position: absolute;
            top: 1px;
            left: 8px;
            cursor: pointer;
            font-size: 10px;
        }
        .confirm-icon{
            position: absolute;
            top: 8px;
            left: 8px;
            cursor: pointer;
        }
        .table-actions {
            position: absolute;
            top: 1px;
            right: 4px;
            display: flex;
            gap: 6px;
        }
        .view-icon {
            position: absolute;
            top: 1px;
            left: 58px;
            cursor: pointer;
            font-size: 10px;
            color: #2980b9;
        }



        .table-actions span {
            cursor: pointer;
            font-size: 14px;
            color: #4c5a67;
        }

        .table-actions span:hover {
            color: #1b1f23;
        }
            
        .reservation-view {
            top: -3px;
            left:21px;
            position: absolute;
            color: #e67e22;
            cursor: pointer;
        }
        

        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 6px;
            gap: 8px;
        }

        .legend-color {
            width: 14px;
            height: 14px;
            border-radius: 4px;
        }
        .checkin-icon {
            position: absolute;
            top: 1px;
            left: 8px;
            cursor: pointer;
            font-size: 10px;
            color: #27ae60;
        }

         .upcoming-box {
             background: #fff7e6;
             border: 1px solid #f1c40f;
             border-radius: 10px;
             padding: 12px;
         }

         .upcoming-title {
             font-weight: bold;
             margin-bottom: 10px;
             color: #d35400;
         }
    </style>`).appendTo(page.body);

    page.add_action_item(
        __('Live Kitchen'),
        () => frappe.set_route('live-kitchen-orders'),
        'fa fa-cutlery'
    );
    page.add_action_item(
        __('Waiter Screen'),
        () => frappe.set_route('waiter-orders'),
        'fa fa-user'
    );
    let main_container = $('<div></div>').appendTo(page.body);

    /* ---------------- TABLE CREATE / UPDATE ---------------- */
function open_table_dialog(table = null) {

    let is_edit = !!table;

    let d = new frappe.ui.Dialog({
        title: is_edit ? `Edit Table ${table.name}` : 'Add New Table',
        size: 'large',
        fields: [
            { label: 'Company', fieldname: 'company', fieldtype: 'Link', options: 'Company', reqd: 1 },
            { label: 'Restaurant Branch', fieldname: 'restaurant_branch', fieldtype: 'Link', options: 'Branch', reqd: 1 },
            { label: 'Floor', fieldname: 'floor', fieldtype: 'Link', options: 'Restaurant Floor', reqd: 1 },
            { label: 'Table Number', fieldname: 'table_number', fieldtype: 'Data', reqd: 1 },
            { label: 'Seating Capacity', fieldname: 'seating_capacity', fieldtype: 'Int', reqd: 1 },
            {
                label: 'Status',
                fieldname: 'status',
                fieldtype: 'Select',
                options: ['Free', 'Occupied', 'Reserved'],
                default: 'Free'
            },
            { label: 'Active', fieldname: 'is_active', fieldtype: 'Check', default: 1 }
        ],
        primary_action_label: is_edit ? 'Update' : 'Create',
        primary_action(values) {

            if (is_edit) {
                frappe.db.set_value('Restaurant Table', table.name, values)
                    .then(() => {
                        frappe.show_alert({ message: 'Table Updated', indicator: 'green' });
                        d.hide();
                        load_tables_by_floor();
                    });
            } else {
                frappe.db.insert({
                doctype: 'Restaurant Table',
                company: values.company,
                restaurant_branch: values.restaurant_branch,
                floor: values.floor,
                table_number: values.table_number,
                seating_capacity: values.seating_capacity,
                status: values.status || 'Free',
                is_active: values.is_active
            }).then(() => {
                frappe.show_alert({
                    message: 'Table Created Successfully',
                    indicator: 'green'
                });
                    d.hide();
                    load_tables_by_floor();
                });
            }
        }
    });

    if (is_edit) {
        d.set_values(table);
    }

    d.show();
}

/* ---------------- DELETE TABLE ---------------- */
function delete_table(table_name) {
    frappe.confirm(
        `Delete table <b>${table_name}</b>?`,
        () => {
            frappe.db.delete_doc('Restaurant Table', table_name)
                .then(() => {
                    frappe.show_alert({ message: 'Table Deleted', indicator: 'red' });
                    load_tables_by_floor();
                });
        }
    );
}
/* ---------------- RESERVATION ---------------- */
// function open_reservation_dialog(table_name) {

//     let d = new frappe.ui.Dialog({
//         title: `Reserve Table ${table_name}`,
//         size: 'large',
//         fields: [
//             { label: 'Customer', fieldname: 'customer', fieldtype: 'Link', options: 'Customer', reqd: 1 },
//             { label: 'Contact', fieldname: 'contact', fieldtype: 'Phone', reqd: 1 },
//             { label: 'Email', fieldname: 'email_id', fieldtype: 'Data' },
//             { label: 'No of Guests', fieldname: 'guest_no', fieldtype: 'Int', reqd: 1 },
//             { label: 'Date Time', fieldname: 'datetime', fieldtype: 'Datetime', reqd: 1 },
//             { label: 'Additional Request', fieldname: 'additional_request', fieldtype: 'Small Text', reqd: 1 }
//         ],
//         primary_action_label: 'Reserve',
//         primary_action(values) {
//         d.hide();

//             frappe.db.insert({
//                 doctype: 'Reservation',
//                 workflow_state: 'Requested',
//                 customer: values.customer,
//                 company: values.company,
//                 restaurant_branch: values.restaurant_branch,
//                 contact: values.contact,
//                 email_id: values.email_id,
//                 guest_no: values.guest_no,
//                 datetime: values.datetime,
//                 additional_request: values.additional_request,
//                 table_info: [{ table: table_name }]
//             }).then(r => {

//                 // ✅ JS WAY: Update child table
//                 frappe.call({
//                     method: 'frappe.client.get',
//                     args: {
//                         doctype: 'Restaurant Table',
//                         name: table_name
//                     },
//                     callback(res) {

//                         let table_doc = res.message;

//                         table_doc.reservation_details =
//                             table_doc.reservation_details || [];

//                         table_doc.reservation_details.push({
//                             reservation: r.name,
//                             datetime: values.datetime,
//                             current_reservation: r.name
//                         });


//                         frappe.call({
//                             method: 'frappe.client.save',
//                             args: { doc: table_doc },
//                             callback() {
//                                 frappe.show_alert({
//                                     message: 'Reservation Created',
//                                     indicator: 'orange'
//                                 });
//                                 load_tables_by_floor();
//                             }
//                         });
//                     }
//                 });
//             });
//         }         
//     });

//     d.show();
// }

/* ---------------- LOAD TABLES ---------------- */
function load_tables_by_floor() {

    main_container.empty();

    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Restaurant Floor',
            fields: ['name'],
            filters: { is_active: 1 }
        },
        callback(rf) {

            let floors = rf.message || [];

            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Restaurant Table',
                    fields: [
                        'name',
                        'seating_capacity',
                        'floor',
                        'status',
                        'company',
                        'restaurant_branch',
                        'table_number',
                        'is_active'
                    ],
                    filters: { is_active: 1 }
                },
                callback(rt) {

                    let tables = rt.message || [];
                    let promises = tables.map(t=>frappe.db.get_doc('Restaurant Table', t.name));
                    
                    Promise.all(promises).then(full_tables => {

                    floors.forEach(f => {

                        let wrapper = $(`
                            <div class="floor-wrapper">
                                <div>
                                    <div class="floor-header">${f.name}</div>
                                    <div class="table-grid normal-tables"></div>
                                </div>
                                <div class="upcoming-box">
                                    <div class="upcoming-title">Upcoming Reservations</div>
                                    <div class="table-grid upcoming-tables"></div>
                                </div>
                            </div>
                        `).appendTo(main_container);

                        let floor_tables = full_tables.filter(t => t.floor === f.name);

                        floor_tables.forEach(t => {

                            // default: do nothing until async completes

                            if (!t.reservation_details || t.reservation_details.length === 0) {
                                render_table(t, wrapper, 'normal');
                                return;
                            }

                            let valid_reservation = [];
                            let has_upcoming = false;
                            let now = moment();

                            let res_promises = t.reservation_details.map(rd => {
                                return frappe.db.get_value(
                                    'Reservation',
                                    rd.current_reservation || rd.reservation,
                                    ['datetime', 'workflow_state']
                                ).then(res => {

                                    let r = res.message;
                                    if (!r || r.workflow_state === 'Cancelled') return;

                                    valid_reservation.push({
                                        ...rd,
                                        datetime: r.datetime,
                                        workflow_state: r.workflow_state
                                    });

                                    // 🔥 UPCOMING CHECK
                                    if (r.workflow_state === 'Confirmed' && r.datetime) {
                                        let res_time = moment(r.datetime);

                                        if (
                                            now.isSameOrAfter(res_time.clone().subtract(30, 'minutes')) &&
                                            now.isBefore(res_time)
                                        ) {
                                            has_upcoming = true;
                                        }
                                    }
                                });
                            });

                            Promise.all(res_promises).then(() => {

                                // clean reservations
                                t.reservation_details = valid_reservation;

                                // 🔥 MOVE TABLE PROPERLY
                                if (has_upcoming) {
                                    frappe.db.set_value('Restaurant Table', t.name, 'status', 'Reserved');
                                    render_table(t, wrapper, 'upcoming');
                                } else {
                                    t._blink = false;
                                    render_table(t, wrapper, 'normal');
                                }

                            });
                        });

                    });

                    });
                }

            });
        }
    });
}
function render_table(t, wrapper, upcoming) {

    let status_class = 'Free';

    if (t.status === 'Occupied') {
        status_class = 'Occupied';
    }
    if (t.status === 'Reserved') {
        status_class = 'Reserved';
    }

    let card = $(`
        <div class="table-card status-${status_class}">
            <div class="table-name">${t.name}</div>
            ${
                t.status === 'Occupied'
                ? `<span class="table-amount">₹ Loading...</span>`
                : `<div class="tab-info">${t.seating_capacity} Seats</div>`
            }
        </div>
    `);

    // 💰 Load occupied table amount
        if (t.status === 'Occupied') {
            frappe.call({
                method: 'restaurant_management.restaurant_management.doctype.restaurant_order.restaurant_order.get_table_amount',
                args: { table: t.name },
                callback(r) {
                    const data = r.message || {};
                    const amount = flt(data.amount || 0).toFixed(2);
                    const symbol = data.currency_symbol || '';

                    card.find('.table-amount')
                        .html(`${symbol} ${amount}`);
                }
            });
        }



    /* ---------- Actions ---------- */
    let actions = $(`
        <div class="table-actions">
            <span title="Edit"><i class="fa fa-pencil"></i></span>
            <span title="Delete"><i class="fa fa-trash"></i></span>
        </div>
    `).appendTo(card);

    actions.find('span:eq(0)').on('click', e => {
        e.stopPropagation();
        open_table_dialog(t);
    });

    actions.find('span:eq(1)').on('click', e => {
        e.stopPropagation();
        delete_table(t.name);
    });
    
    /* ---------- Reservation Logic ---------- */
    if (t.reservation_details && t.reservation_details.length > 0) {
        // Sirf 1 Icon (📋) dikhana hai chahe 10 reservation ho
        $('<div class="reservation-view" title="View All Reservations">📋</div>')
            .appendTo(card)
            .on('click', e => {
                e.stopPropagation();
                open_multi_reservation_dialog(t); 
            });
    } 
        $('<div class="reserve-icon" title="New Reservation">📅</div>')
            .appendTo(card)
            .on('click', e => {
                e.stopPropagation();
                open_reservation_dialog(t.name);
            });
    

    // Sahi grid me append karna
    if (upcoming === 'upcoming') {
        wrapper.find('.upcoming-tables').append(card);
    } else {
        wrapper.find('.normal-tables').append(card);
    }

    card.on('click', () => {
        frappe.set_route('restaurant-pos', encodeURIComponent(t.name));
    });
}

load_tables_by_floor();
};

function open_reservation_dialog(table_name) {
    let d = new frappe.ui.Dialog({
        title: `Reserve Table ${table_name}`,
        size: 'large',
        fields: [
            { label: 'Company', fieldname: 'company', fieldtype: 'Link', options: 'Company', reqd: 1 },
            { label: 'Restaurant Branch', fieldname: 'restaurant_branch', fieldtype: 'Link', options: 'Branch', reqd: 1 },
            { label: 'Customer', fieldname: 'customer', fieldtype: 'Link', options: 'Customer', reqd: 1 },
            { label: 'Contact', fieldname: 'contact', fieldtype: 'Phone', reqd: 1 },
            { label: 'Email', fieldname: 'email_id', fieldtype: 'Data' },
            { label: 'No of Guests', fieldname: 'guest_no', fieldtype: 'Int', reqd: 1 },
            { label: 'Date Time', fieldname: 'datetime', fieldtype: 'Datetime', reqd: 1 },
            { label: 'Additional Request', fieldname: 'additional_request', fieldtype: 'Small Text' }
        ],
        primary_action_label: 'Reserve',
        primary_action(values) {
            d.hide();

            // Get advance settings first
            Promise.all([
                frappe.db.get_single_value('Restaurant Setting', 'advance_policy'),
                frappe.db.get_single_value('Restaurant Setting', 'advance_per_table'),
                frappe.db.get_single_value('Restaurant Setting', 'advance_per_guest')
            ]).then(([policy, per_table, per_guest]) => {

                let advance_amount =
                    policy === 'Per Guest'
                        ? values.guest_no * per_guest
                        : per_table;
                // Create reservation WITH advance_amount
                frappe.db.insert({
                    doctype: 'Reservation',
                    workflow_state: 'Requested',
                    company: values.company,
                    restaurant_branch: values.restaurant_branch,
                    customer: values.customer,
                    contact: values.contact,
                    email_id: values.email_id,
                    guest_no: values.guest_no,
                    datetime: values.datetime,
                    additional_request: values.additional_request,
                    table_info: [{ table: table_name }],
                    advance_amount: advance_amount
                }).then(r => {

                    // Update Restaurant Table
                    frappe.call({
                        method: 'frappe.client.get',
                        args: { doctype: 'Restaurant Table', name: table_name },
                        callback(res) {
                            let table_doc = res.message;
                            table_doc.reservation_details ||= [];
                            table_doc.reservation_details.push({
                                reservation: r.name,
                                datetime: values.datetime,
                                current_reservation: r.name
                            });
                            frappe.db.get_value("Company", values.company, "default_currency").then(c_res => {
                            let currency = c_res.message ? c_res.message.default_currency : '';
                            if (!currency) currency = '';

                            frappe.db.get_value("Currency", currency, "symbol").then(s_res => {
                            let symbol = s_res.message ? s_res.message.symbol : '';

                                frappe.call({
                                    method: 'frappe.client.save',
                                    args: { doc: table_doc },
                                    callback() {
                                        frappe.show_alert({
                                            message: `Reservation Created (Advance ${symbol} ${advance_amount})`,
                                            indicator: 'green'
                                        });
                                        load_tables_by_floor();
                                    }
                                });
                                })
                            })

                            
                        }
                    });
                });
            });
        }
    });

    d.show();
}

// async function open_multi_reservation_dialog(t) {
//     let d = new frappe.ui.Dialog({
//         title: `Reservations for ${t.name}`,
//         size: 'large',
//         fields: [
//             { fieldtype: 'HTML', fieldname: 'list_html' }
//         ]
//     });

//     // Fetch reservations
//     let reservations_raw = await Promise.all(
//         t.reservation_details.map(rd => 
//             frappe.db.get_value(
//                 'Reservation',
//                 rd.reservation || rd.current_reservation,
//                 ['name', 'customer', 'workflow_state', 'datetime', 'advance_amount', 'company']
//             )
//         )
//     );

//     let now = moment();

//     let reservations = reservations_raw
//         .map(r => r.message)
//         .filter(Boolean)
//         .sort((a, b) =>
//             Math.abs(moment(a.datetime).diff(now)) -
//             Math.abs(moment(b.datetime).diff(now))
//         );

//     let html = `
//         <table class="table table-bordered" style="font-size:12px;">
//             <thead>
//                 <tr>
//                     <th>#</th>
//                     <th>ID</th>
//                     <th>Customer</th>
//                     <th>Date</th>
//                     <th>Time</th>
//                     <th>Status</th>
//                     <th>Advance</th>
//                     <th>Action</th>
//                 </tr>
//             </thead>
//             <tbody>`;

//     for (let index = 0; index < reservations.length; index++) {
//         let r = reservations[index];
//         let m = moment(r.datetime);

//         let actions = [];
//         if (r.workflow_state === 'Requested') {
//             actions.push(`<button class="btn btn-xs btn-primary" onclick="update_res_status('${r.name}','Confirmed')">Confirm</button>`);
//             actions.push(`<button class="btn btn-xs btn-warning" onclick="create_advance_payment('${r.name}')">Advance</button>`);
//             actions.push(`<button class="btn btn-xs btn-danger" onclick="cancel_reservation('${r.name}')">Cancel</button>`);
//         }
//         if (r.workflow_state === 'Confirmed') {
//             actions.push(`<button class="btn btn-xs btn-success" onclick="check_in_reservation('${t.name}','${r.name}')">Check-in</button>`);
//             actions.push(`<button class="btn btn-xs btn-danger" onclick="cancel_reservation('${r.name}')">Cancel</button>`);
//         }

//         // Get currency symbol
//         let currency = await frappe.db.get_value("Company", r.company, "default_currency");
//         currency = currency.message ? currency.message.default_currency : null;

//         let symbol = '';
//         if (currency) {
//             let curr = await frappe.db.get_value("Currency", currency, "symbol");
//             symbol = curr.message ? curr.message.symbol : '';
//         }

//         html += `
//             <tr>
//                 <td>${index + 1}</td>
//                 <td>${r.name}</td>
//                 <td>${r.customer || '-'}</td>
//                 <td>${m.format('DD-MM-YYYY')}</td>
//                 <td>${m.format('hh:mm A')}</td>
//                 <td>${r.workflow_state}</td>
//                 <td>${symbol} ${r.advance_amount || 0}</td>
//                 <td>${actions.join(' ')}</td>
//             </tr>`;
//     }

//     html += `</tbody></table>`;

//     d.fields_dict.list_html.$wrapper.html(html);
//     d.show();
//     window.cur_dialog = d;
// }
async function open_multi_reservation_dialog(t) {

    // ✅ Add Blink CSS only once
    if (!document.getElementById("reservation-blink-style")) {
        const style = document.createElement("style");
        style.id = "reservation-blink-style";
        style.innerHTML = `
            .blink-row {
                animation: blinkRow 1s infinite;
            }
            @keyframes blinkRow {
                0%   { background-color: rgba(231,76,60,0.1); }
                50%  { background-color: rgba(231,76,60,0.35); }
                100% { background-color: rgba(231,76,60,0.1); }
            }
        `;
        document.head.appendChild(style);
    }

    let d = new frappe.ui.Dialog({
        title: `Reservations for ${t.name}`,
        size: 'large',
        fields: [
            { fieldtype: 'HTML', fieldname: 'list_html' }
        ]
    });

    if (!t.reservation_details || t.reservation_details.length === 0) {
        d.fields_dict.list_html.$wrapper.html("<p>No reservations found.</p>");
        d.show();
        return;
    }

    // ✅ Fetch reservations
    let reservations_raw = await Promise.all(
        t.reservation_details.map(rd =>
            frappe.db.get_value(
                'Reservation',
                rd.reservation || rd.current_reservation,
                ['name', 'customer', 'workflow_state', 'datetime', 'advance_amount', 'company']
            )
        )
    );

    let now = moment();

    let reservations = reservations_raw
        .map(r => r.message)
        .filter(Boolean)
        .sort((a, b) =>
            Math.abs(moment(a.datetime).diff(now)) -
            Math.abs(moment(b.datetime).diff(now))
        );

    let html = `
        <table class="table table-bordered" style="font-size:12px;">
            <thead>
                <tr>
                    <th>#</th>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Advance</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>`;

    for (let index = 0; index < reservations.length; index++) {

        let r = reservations[index];
        let m = moment(r.datetime);

        /* ---------------- ACTION BUTTONS ---------------- */
        let actions = [];

        if (r.workflow_state === 'Requested') {
            actions.push(`<button class="btn btn-xs btn-primary" onclick="update_res_status('${r.name}','Confirmed')">Confirm</button>`);
            actions.push(`<button class="btn btn-xs btn-warning" onclick="create_advance_payment('${r.name}')">Advance</button>`);
            actions.push(`<button class="btn btn-xs btn-danger" onclick="cancel_reservation('${r.name}')">Cancel</button>`);
        }

        if (r.workflow_state === 'Confirmed') {
            actions.push(`<button class="btn btn-xs btn-success" onclick="check_in_reservation('${t.name}','${r.name}')">Check-in</button>`);
            actions.push(`<button class="btn btn-xs btn-danger" onclick="cancel_reservation('${r.name}')">Cancel</button>`);
        }

        /* ---------------- BLINK LOGIC ---------------- */
        let is_blink = false;

        if (r.workflow_state === 'Confirmed' && r.datetime) {
            let res_time = moment(r.datetime);

            if (
                now.isSameOrAfter(res_time.clone().subtract(30, 'minutes')) &&
                now.isBefore(res_time)
            ) {
                is_blink = true;
            }
        }

        /* ---------------- GET CURRENCY SYMBOL ---------------- */
        let symbol = '';

        if (r.company) {
            let currency_res = await frappe.db.get_value("Company", r.company, "default_currency");
            let currency = currency_res.message ? currency_res.message.default_currency : null;

            if (currency) {
                let curr_res = await frappe.db.get_value("Currency", currency, "symbol");
                symbol = curr_res.message ? curr_res.message.symbol : '';
            }
        }

        /* ---------------- TABLE ROW ---------------- */
        html += `
            <tr class="${is_blink ? 'blink-row' : ''}">
                <td>${index + 1}</td>
                <td>${r.name}</td>
                <td>${r.customer || '-'}</td>
                <td>${m.format('DD-MM-YYYY')}</td>
                <td>${m.format('hh:mm A')}</td>
                <td>${r.workflow_state}</td>
                <td>${symbol} ${r.advance_amount || 0}</td>
                <td>${actions.join(' ')}</td>
            </tr>`;
    }

    html += `</tbody></table>`;

    d.fields_dict.list_html.$wrapper.html(html);
    d.show();
    window.cur_dialog = d;
}


window.update_res_status = function (reservation_name, status) {
    frappe.db.set_value('Reservation', reservation_name, 'workflow_state', status)
        .then(() => {
            frappe.show_alert(`Reservation ${status}`);
            cur_dialog.hide();
            load_tables_by_floor();
        });
};

window.cancel_reservation = function (reservation_name) {
    frappe.confirm('Cancel this reservation?', () => {
        frappe.db.set_value('Reservation', reservation_name, 'workflow_state', 'Cancelled')
            .then(() => {
                frappe.show_alert('Reservation Cancelled');
                cur_dialog.hide();
                load_tables_by_floor();
            });
    });
};
window.check_in_reservation = function (table_name, reservation_name) {
    frappe.confirm('Confirm customer check-in?', () => {

        frappe.db.set_value('Reservation', reservation_name, 'workflow_state', 'Checked-In')
            .then(() => {

                frappe.db.set_value('Restaurant Table', table_name, 'status', 'Occupied')
                    .then(() => {
                        frappe.show_alert('Customer Checked-In');
                        cur_dialog.hide();
                        load_tables_by_floor();
                    });
            });
    });
};
// window.create_advance_payment = function (reservation_name) {

//     // 1️⃣ Get reservation details
//     frappe.db.get_value(
//         'Reservation',
//         reservation_name,
//         ['customer', 'advance_amount', 'datetime']
//     ).then(r => {

//         let res = r.message;

//         if (!res || !res.advance_amount) {
//             frappe.msgprint('Advance amount not set for this reservation');
//             return;
//         }

//         // 2️⃣ Create Payment Entry
//         frappe.call({
//             method: 'frappe.client.insert',
//             args: {
//                 doc: {
//                     doctype: 'Payment Entry',
//                     payment_type: 'Receive',
//                     party_type: 'Customer',
//                     party: res.customer,
//                     paid_amount: res.advance_amount,
//                     received_amount: res.advance_amount,
//                     custom_reservation: reservation_name,
//                     reference_date: res.datetime,
//                     mode_of_payment: 'Cash',
//                     party_account: 'Debtors - SD',
//                     paid_to: 'Cash - SD'
//                 }
//             }
//         }).then(pe => {

//             // 3️⃣ Submit Payment Entry
//             frappe.call({
//                 method: 'frappe.client.submit',
//                 args: {
//                     doc: pe.message
//                 }
//             }).then(() => {

//                 // 4️⃣ Auto confirm reservation
//                 frappe.db.set_value(
//                     'Reservation',
//                     reservation_name,
//                     'workflow_state',
//                     'Confirmed'
//                 ).then(() => {

//                     frappe.show_alert({
//                         message: 'Advance received & Reservation Confirmed',
//                         indicator: 'green'
//                     });

//                     if (window.cur_dialog) {
//                         cur_dialog.hide();
//                     }

//                     load_tables_by_floor();
//                 });
//             });
//         });
//     });
// };
window.create_advance_payment = function (reservation_name) {

    const payment_mode = "Cash";

    // 1️⃣ Get reservation details
    frappe.db.get_value(
        "Reservation",
        reservation_name,
        ["customer", "advance_amount", "datetime", "company"]
    ).then(r => {

        const res = r.message;
        if (!res || !res.advance_amount || res.advance_amount <= 0) {
            frappe.msgprint("Advance amount not set");
            return;
        }

        const company = res.company || frappe.defaults.get_default("company");

        // 2️⃣ Get accounts safely from backend
        frappe.call({
            method: "restaurant_management.restaurant_management.customization.api.table_board.get_payment_accounts",
            args: {
                company: company,
                mode_of_payment: payment_mode
            }
        }).then(acc => {

            const party_account = acc.message.receivable;
            const paid_to = acc.message.paid_to;

            if (!party_account || !paid_to) {
                frappe.throw("Payment accounts not configured");
                return;
            }

            // 3️⃣ Create Payment Entry
            frappe.call({
                method: "frappe.client.insert",
                args: {
                    doc: {
                        doctype: "Payment Entry",
                        payment_type: "Receive",
                        company: company,

                        party_type: "Customer",
                        party: res.customer,

                        posting_date: res.datetime || frappe.datetime.nowdate(),
                        reference_date: res.datetime,

                        mode_of_payment: payment_mode,
                        custom_reservation: reservation_name,

                        paid_from: party_account,
                        paid_to: paid_to,

                        paid_amount: res.advance_amount,
                        received_amount: res.advance_amount
                    }
                }
            }).then(insert_res => {

                // 4️⃣ Submit Payment Entry
                return frappe.call({
                    method: "frappe.client.submit",
                    args: { doc: insert_res.message }
                });

            }).then(() => {

                // 5️⃣ Confirm reservation
                return frappe.db.set_value(
                    "Reservation",
                    reservation_name,
                    "workflow_state",
                    "Confirmed"
                );

            }).then(() => {

                frappe.show_alert({
                    message: "Advance received & Reservation Confirmed",
                    indicator: "green"
                });

                if (window.cur_dialog) cur_dialog.hide();
                load_tables_by_floor();
            });
        });
    });
};
