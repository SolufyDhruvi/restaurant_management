frappe.pages['restaurant-table-lay'].on_page_load = function (wrapper) {

    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Restaurant Floor Plan',
        single_column: true
    });

    page.add_menu_item('Add Table', () => {
        open_table_dialog();
    });

    /* ---------------- CSS ---------------- */
    $(`<style>
        .blink {
            animation: blinkBorder 1s infinite;
        }

        @keyframes blinkBorder {
            0% { box-shadow: 0 0 0 rgba(231,76,60,0); }
            50% { box-shadow: 0 0 15px rgba(231,76,60,0.9); }
            100% { box-shadow: 0 0 0 rgba(231,76,60,0); }
        }

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
            top: 9px;
            left:9px;
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
    function open_reservation_dialog(table_name) {

        let d = new frappe.ui.Dialog({
            title: `Reserve Table ${table_name}`,
            fields: [
                { label: 'Customer', fieldname: 'customer', fieldtype: 'Link', options: 'Customer', reqd: 1 },
                { label: 'Contact', fieldname: 'contact', fieldtype: 'Phone', reqd: 1 },
                { label: 'Email', fieldname: 'email_id', fieldtype: 'Data' },
                { label: 'No of Guests', fieldname: 'guest_no', fieldtype: 'Int', reqd: 1 },
                { label: 'Date Time', fieldname: 'datetime', fieldtype: 'Datetime', reqd: 1 }
            ],
            primary_action_label: 'Reserve',
            primary_action(values) {

                frappe.db.insert({
                    doctype: 'Reservation',
                    workflow_state: 'Requested',
                    customer: values.customer,
                    contact: values.contact,
                    email_id: values.email_id,
                    guest_no: values.guest_no,
                    datetime: values.datetime,
                    table_info: [{ table: table_name }]
                }).then((r) => {
                    frappe.db.set_value('Restaurant Table', table_name, {'current_reservation': r.name })
                        // frappe.db.set_value("Restaurant Table", table_name, "current_reservation", values.name)
                        .then(() => {
                            frappe.show_alert({ message: 'Table Reserved', indicator: 'orange' });
                            d.hide();
                            load_tables_by_floor();
                        });
                });
            }
        });

        d.show();
    }

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
                            'current_reservation',
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

                            let floor_tables = tables.filter(t => t.floor === f.name);

                            floor_tables.forEach(t => {
                                

                                if (!t.current_reservation) {
                                    render_table(t, wrapper, false);
                                    return;
                                }
                                // 🔒 If table is already occupied, DO NOTHING
                                if (t.status === 'Occupied') {
                                    render_table(t, wrapper, 'normal');
                                    return;
                                }


                                frappe.db.get_value(
                                    'Reservation',
                                    t.current_reservation,
                                    ['datetime', 'workflow_state', 'creation']
                                ).then(res => {

                                    let r = res.message;
                                    let now = moment();
                                    let res_time = moment(r.datetime);

                                    // ⛔ Reservation time passed → auto release
                                    if (now.isSameOrAfter(res_time)) {
                                        auto_release_table(t.name, t.current_reservation);
                                        return;
                                    }

                                    // ⏳ Requested & not confirmed in 15 min → cancel
                                    if (r.workflow_state === 'Requested') {
                                        let created = moment(r.creation);
                                        if (now.diff(created, 'minutes') >= 15) {
                                            cancel_reservation(t.name, t.current_reservation);
                                            return;
                                        }
                                        render_table(t, wrapper, 'normal');
                                        return;
                                    }
                                    if (r.workflow_state === 'Confirmed') {

                                        // 🔒 DO NOT override occupied table
                                        if (t.status === 'Occupied') {
                                            render_table(t, wrapper, 'normal');
                                            return;
                                        }

                                        let now = moment();
                                        let res_time = moment(r.datetime, "YYYY-MM-DD HH:mm:ss");
                                        let upcoming_start = res_time.clone().subtract(30, 'minutes');

                                        if (now.isSameOrAfter(upcoming_start) && now.isBefore(res_time)) {

                                            frappe.db.set_value('Restaurant Table', t.name, 'status', 'Reserved');
                                            render_table(t, wrapper, 'upcoming');

                                        } else {

                                            // ⚠️ Future reservation but currently free
                                            render_table(t, wrapper, 'normal');
                                        }
                                    }



                                });

                            });
                        });
                    }
                });
            }
        });
    }
function auto_release_table(table_name, reservation_name) {

    frappe.db.set_value('Reservation', reservation_name, 'workflow_state', 'Cancelled')
        .then(() => {
            frappe.db.set_value('Restaurant Table', table_name, {
                current_reservation: null,
                status: 'Free'
            }).then(() => {
                frappe.show_alert({
                    message: `Table ${table_name} auto-released due to no-show`,
                    indicator: 'red'
                });
                load_tables_by_floor();
            });
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
                    card.find('.table-amount')
                        .html(`₹ ${flt(r.message || 0).toFixed(2)}`);
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
    if (t.current_reservation) {

        frappe.db.get_value(
            'Reservation',
            t.current_reservation,
            ['workflow_state', 'customer', 'guest_no', 'datetime']
        ).then(res => {

            let r = res.message;

            // 🕒 Requested Reservation
            if (r.workflow_state === 'Requested') {

                $('<div class="reservation-view" title="Confirm Reservation">🕒</div>')
                    .appendTo(card)
                    .on('click', e => {
                        e.stopPropagation();
                        open_confirm_dialog(t.name, t.current_reservation, r);
                    });

                wrapper.find('.normal-tables').append(card);
            }

            
            else if (r.workflow_state === 'Confirmed') {

                $('<div class="checkin-icon" title="Check-In">✔️</div>')
                    .appendTo(card)
                    .on('click', e => {
                        e.stopPropagation();
                        check_in_reservation(t.name, t.current_reservation);
                    });

                $('<div class="cancel-icon" title="Cancel Reservation">❌</div>')
                    .appendTo(card)
                    .on('click', e => {
                        e.stopPropagation();
                        cancel_reservation(t.name, t.current_reservation);
                    });
                $('<div class="view-icon" title="View Reservation">ℹ️</div>')
                    .appendTo(card)
                    .on('click', e => {
                        e.stopPropagation();
                        open_view_reservation_dialog(t.current_reservation);
                    });


                // ✅ HERE IS THE FIX
                if (upcoming === 'upcoming') {
                    wrapper.find('.upcoming-tables').append(card);
                } else {
                    wrapper.find('.normal-tables').append(card);
                }
            }

        });

    } else {

        // Free table → Reserve icon
        $('<div class="reserve-icon">📅</div>')
            .appendTo(card)
            .on('click', e => {
                e.stopPropagation();
                open_reservation_dialog(t.name);
            });

        wrapper.find('.normal-tables').append(card);
    }

    card.on('click', () => {
        frappe.set_route('restaurant-pos', encodeURIComponent(t.name));
    });
}
function cancel_reservation(table_name, reservation_name) {

    frappe.confirm(
        'Cancel this reservation?',
        () => {
            frappe.db.set_value('Reservation', reservation_name, 'workflow_state', 'Cancelled')
                .then(() => {
                    frappe.db.set_value('Restaurant Table', table_name, {
                        current_reservation: null,
                        status: 'Free'
                    }).then(() => {
                        frappe.show_alert({
                            message: 'Reservation Cancelled',
                            indicator: 'red'
                        });
                        load_tables_by_floor();
                    });
                });
        }
    );
}


function check_in_reservation(table_name, reservation_name) {

    frappe.confirm(
        'Confirm customer check-in?',
        () => {
            frappe.db.set_value('Reservation', reservation_name, 'workflow_state', 'Checked-In')
                .then(() => {
                    frappe.db.set_value('Restaurant Table', table_name, {
                        current_reservation: null,
                        status: 'Free'
                    }).then(() => {
                        frappe.show_alert({
                            message: 'Customer Checked-In',
                            indicator: 'green'
                        });
                        load_tables_by_floor();
                    });
                });
        }
    );
}



load_tables_by_floor();
};
function open_view_reservation_dialog(reservation_name) {

    frappe.db.get_value(
        'Reservation',
        reservation_name,
        [
            'customer',
            'contact',
            'email_id',
            'guest_no',
            'datetime',
            'workflow_state'
        ]
    ).then(res => {

        let r = res.message;

        let d = new frappe.ui.Dialog({
            title: 'Reservation Details',
            fields: [
                { fieldtype: 'HTML', fieldname: 'details' }
            ],
            primary_action_label: 'Close',
            primary_action() {
                d.hide();
            }
        });

        d.fields_dict.details.$wrapper.html(`
            <table class="table table-bordered">
                <tr><th>Customer</th><td>${r.customer || '-'}</td></tr>
                <tr><th>Contact</th><td>${r.contact || '-'}</td></tr>
                <tr><th>Email</th><td>${r.email_id || '-'}</td></tr>
                <tr><th>No of Guests</th><td>${r.guest_no}</td></tr>
                <tr><th>Date & Time</th><td>${r.datetime}</td></tr>
                <tr><th>Status</th><td><b>${r.workflow_state}</b></td></tr>
            </table>
        `);

        d.show();
    });
}


function open_confirm_dialog(table_name, reservation_name, data) {

    let d = new frappe.ui.Dialog({
        title: 'Confirm Reservation',
        fields: [
            { fieldtype: 'HTML', fieldname: 'info' }
        ],
        primary_action_label: 'Confirm',
        primary_action() {

            frappe.db.set_value(
                'Reservation',
                reservation_name,
                'workflow_state',
                'Confirmed'
            ).then(() => {
                frappe.show_alert({
                    message: 'Reservation Confirmed',
                    indicator: 'green'
                });
                d.hide();
                load_tables_by_floor();
            });
        }
    });

    d.fields_dict.info.$wrapper.html(`
        <p><b>Customer:</b> ${data.customer}</p>
        <p><b>Guests:</b> ${data.guest_no}</p>
        <p><b>Date & Time:</b> ${data.datetime}</p>
    `);

    d.show();
}

