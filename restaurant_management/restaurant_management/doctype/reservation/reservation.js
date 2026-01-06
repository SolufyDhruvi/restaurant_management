// Copyright (c) 2025, Dhruvi Soliya and contributors
// For license information, please see license.txt

frappe.ui.form.on("Reservation", {
	refresh(frm) {
        if(!frm.doc.__islocal && frm.doc.workflow_state == "Confirmed"){
            if(!frm.doc.advance_deposite_invoice && frm.doc.table_info.length > 0){
                frm.add_custom_button("Create Advance Deposite Sales Invoice", function(){
                    frm.call({
                        method: "make_advance_deposite_sales_invoice",
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
    // workflow_state(frm){
    //     if(frm.doc.workflow_state == "Confirmed"){
    //         frm.call({
    //             method: "on_workflow_state_change",
    //             doc: frm.doc
    //         })
    //     }
    // }
});
