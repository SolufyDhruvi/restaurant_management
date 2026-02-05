// Copyright (c) 2025, Dhruvi Soliya and contributors
// For license information, please see license.txt
frappe.ui.form.on('Restaurant Table', {
	refresh(frm) {

		if (!frm.doc.table_number) return;

		// 🔥 This will now use host_name from site_config.json
		let base_url = frappe.urllib.get_base_url();

		let menu_url = `${base_url}/app/restaurant-menu?table=${frm.doc.table_number}`;

		let qr_url =
			"https://api.qrserver.com/v1/create-qr-code/" +
			"?size=220x220&data=" +
			encodeURIComponent(menu_url);

		let html = `
			<div style="text-align:center">
				<img src="${qr_url}" style="width:220px"/>
				<p><b>Table:</b> ${frm.doc.table_number}</p>
			</div>
		`;

		frm.fields_dict.qr_code.$wrapper.html(html);
	}
});
