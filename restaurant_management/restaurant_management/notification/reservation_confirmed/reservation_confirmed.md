<p>Dear {{ doc.customer }},</p>

<p>Your table reservation at {{ doc.restaurant_branch }} is confirmed.</p>

<p>Date: {{ frappe.utils.formatdate(doc.datetime) }}
Time: {{ frappe.utils.format_time(doc.datetime) }}
Guests: {{ doc.guest_no }}
Table:
{% for t in doc.table_info %}
- {{ t.table }}
{% endfor %}</p>

<p>We look forward to serving you.</br>
Thank you for choosing us!</p>

<p>{{ doc.restaurant_branch }}</p>
