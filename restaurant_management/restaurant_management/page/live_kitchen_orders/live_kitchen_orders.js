frappe.pages['live-kitchen-orders'].on_page_load = function (wrapper) {
    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Live Kitchen Display',
        single_column: true
    });

    /* ---------------- CSS ---------------- */
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
            height: 300px;
            overflow: hidden;
        }
        .kot-header {
            background: #0984e3;
            color: #fff;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            font-weight: bold;
        }
        .timer-badge {
            background: rgba(255,255,255,0.25);
            padding: 4px 8px;
            border-radius: 6px;
            font-family: monospace;
        }
        .kot-body {
            padding: 15px;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }
        .order-owner {
            font-size: 12px;
            color: #636e72;
            margin-bottom: 8px;
        }
        .item-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 6px;
        }
        .qty-badge {
            background: #f1f2f6;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: bold;
            width: fit-content;
            margin-bottom: 10px;
        }
        .btn {
            margin-top: auto;
            padding: 10px;
            border-radius: 8px;
            border: none;
            font-weight: bold;
            cursor: pointer;
        }
        .btn-cooking { background: #f39c12; color: #fff; }
        .btn-ready { background: #27ae60; color: #fff; }
        .fullscreen-btn {
            position: fixed;
            top: 80px;
            right: 30px;
            z-index: 999;
            background: #2d3436;
            color: white;
            border: none;
            padding: 10px 14px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
        }
    </style>`).appendTo(page.body);

    const grid = $('<div class="kds-layout"></div>').appendTo(page.body);

    /* ---------------- UTILS ---------------- */

    // function speak_text(text) {
    //     if (!window.speechSynthesis) return;
    //     let msg = new SpeechSynthesisUtterance(text);
    //     msg.lang = "en-IN";
    //     window.speechSynthesis.cancel();
    //     window.speechSynthesis.speak(msg);
    // }
    function speak_text(text) {
    if (!window.speechSynthesis) return;

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "hi-IN";

    const voices = window.speechSynthesis.getVoices();

    // Hindi voice find karo
    const hindiVoice = voices.find(v => v.lang === "hi-IN");

    if (hindiVoice) {
        msg.voice = hindiVoice;
    } else {
        console.log("Hindi voice not found, using default");
    }

    // 🔊 Slow speed
    msg.rate = 0.6;
    msg.pitch = 1;
    msg.volume = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
}

// Chrome ke liye (voices load delay hota hai)
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

    const fullscreenBtn = $('<button class="fullscreen-btn">⛶ Fullscreen</button>')
        .appendTo(page.body)
        .on('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });
    function get_time_diff(creation) {
        if (!creation) return "00:00";
        let diff = moment().diff(moment(creation));
        let d = moment.duration(diff);
        let m = Math.floor(d.asMinutes());
        let s = d.seconds();
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    /* ---------------- LOAD KDS ---------------- */

    function load_kds() {
        frappe.call({
            method: "restaurant_management.restaurant_management.doctype.restaurant_order.restaurant_order.get_kitchen_orders",
            callback(r) {
                grid.empty();

                if (!r.message || !r.message.length) {
                    grid.append(`
                        <div style="grid-column:1/-1;text-align:center;color:#aaa;">
                            No Active Kitchen Items
                        </div>
                    `);
                    return;
                }

                r.message.forEach(item => {
                    if (item.status === "Complete") return;

                    let card = $(`
                        <div class="kot-card">
                            <div class="kot-header">
                                <span>${item.table || 'Dine-In'}</span>
                                <span class="timer-badge" data-start="${item.creation}">
                                    ${get_time_diff(item.creation)}
                                </span>
                            </div>
                            <div class="kot-body">
                                <div class="order-owner">
                                    ${item.order} | ${item.owner?.split('@')[0]}
                                </div>
                                <div class="item-name">${item.item_name}</div>
                                <div class="qty-badge">Qty: ${item.qty}</div>
                                <div style="color:red; font-size:12px;">
                                   Note:  ${item.kitchen_note}
                                </div>
                            </div>
                        </div>
                    `);

                    let body = card.find('.kot-body');

                    if (item.status === "Open") {
                        let btn = $(`<button class="btn btn-cooking">START COOKING</button>`);
                        btn.on('click', () => update_status(item.row_name, "In Process"));
                        body.append(btn);
                    }

                    if (item.status === "In Process") {
                        let btn = $(`<button class="btn btn-ready">MARK AS READY</button>`);
                        btn.on('click', () => update_status(item.row_name, "Complete", item.order));
                        body.append(btn);
                    }

                    grid.append(card);
                });
            }
        });
    }

    /* ---------------- UPDATE STATUS ---------------- */

    function update_status(row_name, status, order_id = "") {
        frappe.call({
            method: "restaurant_management.restaurant_management.doctype.restaurant_order.restaurant_order.update_item_status",
            args: { row_name, status },
            callback() {
                load_kds();

                if (status === "Complete") {
                    speak_text(`Order ${order_id} is ready`);
                    frappe.show_alert({
                        message: `Order ${order_id} Ready`,
                        indicator: "green"
                    });
                }
            }
        });
    }

    /* ---------------- AUTO REFRESH ---------------- */

    load_kds();

    setInterval(load_kds, 5000);

    setInterval(() => {
        $('.timer-badge').each(function () {
            $(this).text(get_time_diff($(this).data('start')));
        });
    }, 1000);
};
