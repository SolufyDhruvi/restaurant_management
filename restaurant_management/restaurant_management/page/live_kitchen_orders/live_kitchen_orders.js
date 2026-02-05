frappe.pages['live-kitchen-orders'].on_page_load = function(wrapper) {
    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Live Kitchen Display',
        single_column: true
    });

    /* ---------------- CSS UPDATED ---------------- */
    $(`<style>
        .kds-layout { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
            gap: 20px; 
            padding: 20px; 
        }
        .kot-card { 
            border: 1px solid #e5e7eb; 
            border-radius: 12px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
            background: #fff;
            display: flex;
            flex-direction: column;
            height: 300px; /* Fixed Height for consistency */
            overflow: hidden;
            transition: 0.2s ease-in-out;
        }
        .kot-card:hover { transform: translateY(-5px); box-shadow: 0 6px 15px rgba(0,0,0,0.15); }
        
        .kot-header { 
            background: #0984e3; 
            color: #fff; 
            padding: 15px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            font-weight: bold; 
            font-size: 16px;
            flex-shrink: 0;
        }
        
        .kot-body { 
            padding: 15px; 
            display: flex;
            flex-direction: column;
            flex-grow: 1; /* Body will take remaining space */
            overflow: hidden;
        }

        .items-list { 
            flex-grow: 1; 
            overflow-y: auto; /* Scroll inside items list if items are many */
            margin-bottom: 10px;
            padding-right: 5px;
        }

        /* Custom Scrollbar for better look */
        .items-list::-webkit-scrollbar { width: 5px; }
        .items-list::-webkit-scrollbar-thumb { background: #dfe6e9; border-radius: 10px; }

        .kot-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 10px 0; 
            border-bottom: 1px solid #f1f2f6; 
            font-weight: 600; 
            color: #2d3436; 
        }
        
        .kot-qty { 
            padding: 2px 10px; 
            border-radius: 6px; 
            color: #0984e3; 
            font-weight: bold; 
            background: #f1f2f6;; 
        }

        .ready-btn { 
            width: 100%; 
            background: #27ae60; 
            color: #fff; 
            border: none; 
            border-radius: 8px; 
            padding: 12px; 
            font-weight: bold; 
            cursor: pointer; 
            font-size: 15px; 
            flex-shrink: 0; /* Button always at bottom */
            transition: 0.2s;
        }
        .ready-btn:hover { background: #219150; }

        .timer-badge { background: rgba(255,255,255,0.25); padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 14px; }
        .order-id-label { font-size: 12px; color: #636e72; margin-bottom: 12px; display: block; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    </style>`).appendTo(page.body);

    const kds_grid = $('<div class="kds-layout"></div>').appendTo(page.body);
    const audio = new Audio("/assets/restaurant_management/sounds/order_ready.mp3");

    function get_time_diff(creation) {
        if (!creation) return "00:00";
        let diff = moment().diff(moment(creation, "YYYY-MM-DD HH:mm:ss"));
        let duration = moment.duration(diff);
        let mins = Math.floor(duration.asMinutes());
        let secs = duration.seconds();
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    page.load_kitchen_data = function() {
        frappe.call({
            method: "restaurant_management.restaurant_management.doctype.restaurant_order.restaurant_order.get_kitchen_orders",
            callback(r) {
                kds_grid.empty();
                if (!r.message || r.message.length === 0) {
                    kds_grid.append('<div style="grid-column:1/-1;text-align:center;padding:100px;color:#ccc;"><h3>No Active Orders (Cooking)</h3></div>');
                    return;
                }

                r.message.forEach(order => {
                    let order_id = order.name;
                    let card = $(`
                        <div class="kot-card">
                            <div class="kot-header">
                                <span>${order.table || 'Dine-In'}</span>
                                <span class="timer-badge" data-start="${order.creation}">${get_time_diff(order.creation)}</span>
                            </div>
                            <div class="kot-body">
                                <span class="order-id-label">${order_id} | ${order.owner.split('@')[0]}</span>
                                <div class="items-list"></div>
                                <button class="ready-btn">MARK AS READY</button>
                            </div>
                        </div>
                    `);

                    if (order.items && order.items.length > 0) {
                        order.items.forEach(item => {
                            card.find('.items-list').append(`
                                <div class="kot-item">
                                    <span>${item.item_name || item.item}</span>
                                    <span class="kot-qty">X${item.qty}</span>
                                </div>
                            `);
                        });
                    }

                    card.find('.ready-btn').on('click', () => {
                        let calls = order.items.map(item => {
                            return frappe.call({
                                method: "restaurant_management.restaurant_management.doctype.restaurant_order.restaurant_order.mark_order_ready",
                                args: { row_name: item.name }
                            });
                        });

                        Promise.all(calls).then(() => {
                            audio.play().catch(() => {});
                            frappe.show_alert({ message: "Order Ready", indicator: "green" });
                            card.fadeOut(300, () => page.load_kitchen_data());
                        });
                    });

                    kds_grid.append(card);
                });
            }
        });
    };

    page.load_kitchen_data();
    setInterval(() => page.load_kitchen_data(), 5000);
    setInterval(() => {
        $('.timer-badge').each(function() {
            $(this).text(get_time_diff($(this).data('start')));
        });
    }, 1000);
};