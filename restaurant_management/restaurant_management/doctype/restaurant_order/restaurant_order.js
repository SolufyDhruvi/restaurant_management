// Copyright (c) 2025, Dhruvi Soliya and contributors
// For license information, please see license.txt

frappe.ui.form.on("Restaurant Order", {
	refresh(frm) {
        if(!frm.doc.__islocal && frm.doc.workflow_state == "Billed"){
            if(!frm.doc.sales_invoice){
                frm.add_custom_button("Create Sales Invoice", function(){
                    frm.call({
                        method: "make_sales_invoice",
                        doc: frm.doc,
                        callback: function(r){
                            if(r.message){
                                var doclist = frappe.model.sync(r.message);
                                frappe.set_route("Form", doclist[0].doctype,doclist[0].name)
                            }
                        }
                    })
                }   , "Create");
            }
           
        }
	},
});

frappe.ui.form.on("Restaurant Order Item", {
    qty: function(frm, cdt, cdn) {
        calculate_amount(frm, cdt, cdn);
    },
    rate: function(frm, cdt, cdn) {
        calculate_amount(frm, cdt, cdn);
    }
});

function calculate_amount(frm, cdt, cdn) {
    let row = locals[cdt][cdn]; // get the row

    // calculate amount
    let qty = row.qty || 0;
    let rate = row.rate || 0;
    row.amount = qty * rate;

    // refresh the field so it updates in the UI
    frm.refresh_field("items");

    // optional: update total in the parent form
    // let total = 0;
    // frm.doc.items.forEach(i => {
    //     total += (i.amount || 0);
    // });
    // frm.set_value("total_amount", total); // assuming your field is called total_amount
}
