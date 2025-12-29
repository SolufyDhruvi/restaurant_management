frappe.pages['kitchen_display'].on_page_load = function(wrapper) {
    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Kitchen Display',
        single_column: true
    });

    function load_orders() {
        page.main.empty();

        frappe.call({
            method: 'restaurant_management.restaurant_management.doctype.restaurant_order.restaurant_order.get_kitchen_orders',
            callback: function(r) {
                let orders = r.message || [];

                if (orders.length === 0) {
                    page.main.html('<h3 style="text-align:center; margin-top:50px;">No orders in kitchen</h3>');
                    return;
                }

                // Container for all cards
                let container = $('<div class="kitchen-grid" style="display:flex; flex-wrap:wrap; justify-content:flex-start;"></div>');
                page.main.append(container);

                orders.forEach(function(order) {
                    // Color based on workflow state
                    let color = '#f28b82'; // Red default for Placed
                    if(order.workflow_state === 'Placed') color = '#f28b82'; // Red
                    else if(order.workflow_state === 'Cooking') color = '#ccff90'; // Yellow
                    else if(order.workflow_state === 'Ready') color = '#ccff90'; // Green

                    let card = $(`
                        <div class="order-card" style="
                            background-color:${color};
                            border-radius:15px;
                            padding:20px;
                            margin:10px;
                            width:280px;
                            box-shadow:0 4px 6px rgba(0,0,0,0.1);
                            transition: transform 0.2s, box-shadow 0.2s;
                            cursor:pointer;
                        ">
                            <h3 style="margin:0 0 10px 0;">Table: ${order.table}</h3>
                            <h4 style="margin:0 0 10px 0;">Order: ${order.name}</h4>
                            <p>Status: <strong>${order.workflow_state}</strong></p>
                            <ul style="padding-left:20px; margin-bottom:15px;"></ul>
                            <button class="btn btn-primary mark-ready" data-name="${order.name}" style="width:100%; padding:12px; font-size:16px;">Mark as Ready</button>
                        </div>
                    `);

                    // Hover effect: lift + shadow
                    card.hover(
                        function() {
                            $(this).css({"transform":"translateY(-5px)","box-shadow":"0 8px 15px rgba(0,0,0,0.2)"});
                        },
                        function() {
                            $(this).css({"transform":"translateY(0)","box-shadow":"0 4px 6px rgba(0,0,0,0.1)"});
                        }
                    );

                    // Append items
                    (order.items || []).forEach(function(i) {
                        card.find('ul').append(`<li>${i.item}: ${i.qty}</li>`);
                    });

                    container.append(card);
                });

                // Attach click events for Mark as Ready
                page.main.find('.mark-ready').click(function() {
                    let order_name = $(this).data('name');
                    frappe.call({
                        method: 'frappe.client.set_value',
                        args: {
                            doctype: 'Restaurant Order',
                            name: order_name,
                            fieldname: 'workflow_state',
                            value: 'Ready'
                        },
                        callback: load_orders
                    });
                });
            }
        });
    }

    load_orders();
    setInterval(load_orders, 10000); // refresh every 10 seconds
};
