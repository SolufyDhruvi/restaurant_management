frappe.pages['restaurant-table-lay'].on_page_load = function(wrapper) {

	let page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Table Occupancy Board',
		single_column: true
	});

	let filters = $(`
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
			callback: function(r) {

				(r.message || []).forEach(t => {

					let gradient = {
						"Free": "linear-gradient(135deg, #a8e063, #56ab2f)",
						"Reserved": "linear-gradient(135deg, #ffcc70, #ff6f00)",
						"Occupied": "linear-gradient(135deg, #ff5858, #b00020)"
					}[t.status] || "linear-gradient(135deg, #90a4ae, #cfd8dc)";

					let badgeColor = {
						"Free": "#2e7d32",
						"Reserved": "#ef6c00",
						"Occupied": "#c62828"
					}[t.status];

					container.append(`
						<div class="col-xl-2 col-lg-3 col-md-4 col-sm-6">
							<div class="table-card" data-name="${t.name}" style="
								background: ${gradient};
								border-radius: 18px;
								padding: 20px;
								color: #fff;
								box-shadow: 0 8px 25px rgba(0,0,0,0.25);
								cursor: pointer;
								position: relative;
								transition: transform 0.35s ease, box-shadow 0.35s ease;
							">
								<span class="status-badge" style="
									position:absolute;
									top:12px;
									right:12px;
									background:${badgeColor};
									color:white;
									padding:4px 10px;
									border-radius:20px;
									font-size:12px;
									font-weight:600;
								">${t.status}</span>

								<h4 style="margin:0 0 8px; font-weight:600;">${t.name}</h4>
								<p style="margin:4px 0;">Floor: <b>${t.floor || '-'}</b></p>
								<p style="margin:4px 0;">Seats: <b>${t.seating_capacity}</b></p>
							</div>
						</div>
					`);
				});

				/* -------- HOVER EFFECT -------- */
				$('.table-card').hover(
					function() {
						$(this).css({
							transform: 'translateY(-12px) scale(1.05)',
							boxShadow: '0 20px 45px rgba(0,0,0,0.35)'
						});
					},
					function() {
						$(this).css({
							transform: 'translateY(0) scale(1)',
							boxShadow: '0 8px 25px rgba(0,0,0,0.25)'
						});
					}
				);
			}
		});
	}

	/* ---------------- FILTER CHANGE ---------------- */
	$('#floor-filter, #status-filter').on('change', load_tables);

	/* ---------------- CLICK → CREATE ORDER ---------------- */
	page.body.on('click', '.table-card', function () {
		let table_name = $(this).data('name');

		let dialog = new frappe.ui.Dialog({
			title: __('Create Restaurant Order'),
			size: 'large',
			fields: [
				{
					label: 'Table',
					fieldname: 'table',
					fieldtype: 'Link',
					options: 'Restaurant Table',
					default: table_name,
					read_only: 1
				},
				{
					label: 'Order Type',
					fieldname: 'order_type',
					fieldtype: 'Select',
					options: 'Dine-In\nTake Away\nDelivery',
					default: 'Dine-In'
				},
				{
					label: 'Customer',
					fieldname: 'customer',
					fieldtype: 'Link',
					options: 'Customer'
				},
				{
					label: 'Items',
					fieldname: 'items',
					fieldtype: 'Table',
					reqd: 1,
					fields: [
						{
							label: 'Item',
							fieldname: 'item',
							fieldtype: 'Link',
							options: 'Item',
							in_list_view: 1,
							reqd: 1
						},
						{
							label: 'Qty',
							fieldname: 'qty',
							fieldtype: 'Int',
							default: 1,
							in_list_view: 1
						}
					]
				}
			],
			primary_action_label: __('Create Order'),
			primary_action(values) {
				if (!values.items || !values.items.length) {
					frappe.msgprint('Please add at least one item');
					return;
				}

				frappe.call({
					method: "restaurant_management.restaurant_management.customization.api.table_board.create_order",
					args: values,
					callback: function(r) {
						if (r.message) {
							frappe.msgprint('Order Created Successfully');
							dialog.hide();
							load_tables();
							frappe.set_route('Form', 'Restaurant Order', r.message);
						}
					}
				});
			}
		});

		dialog.show();
	});

	load_tables();
};
