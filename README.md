<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>PIIGuard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 280px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      color: #1a1a1a;
      background: #fff;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid #ebebeb;
    }
    h1 { font-size: 15px; font-weight: 600; }
    .toggle-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #666;
    }
    .toggle { position: relative; width: 34px; height: 19px; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; inset: 0;
      background: #ccc; border-radius: 20px; cursor: pointer;
      transition: background 0.2s;
    }
    .slider::before {
      content: ""; position: absolute;
      width: 13px; height: 13px; left: 3px; top: 3px;
      background: white; border-radius: 50%;
      transition: transform 0.2s;
    }
    input:checked + .slider { background: #2563eb; }
    input:checked + .slider::before { transform: translateX(15px); }
    .category { border-bottom: 1px solid #ebebeb; }
    .category-header {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      cursor: pointer;
      user-select: none;
      gap: 8px;
    }
    .category-header:hover { background: #f8fafc; }
    .category-header.disabled {
      cursor: default;
      opacity: 0.5;
    }
    .category-header.disabled:hover { background: none; }
    .category-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      flex: 1;
    }
    .category-arrow {
      font-size: 10px;
      color: #94a3b8;
      transition: transform 0.2s;
      display: inline-block;
    }
    .category-arrow.open { transform: rotate(180deg); }
    .category-rules {
      padding: 4px 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 9px;
    }
    .subgroup-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #f1f5f9;
    }
    .subgroup-header:first-child {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }
    .subgroup-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #94a3b8;
    }
    .subgroup-checkbox {
      width: 13px; height: 13px; cursor: pointer;
      accent-color: #2563eb;
      flex-shrink: 0;
    }
    .rule-row {
      padding-left: 21px;
    }
    .rule-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: #333;
      cursor: pointer;
    }
    .rule-row input[type="checkbox"] {
      width: 14px; height: 14px; cursor: pointer;
      accent-color: #2563eb;
      flex-shrink: 0;
    }
    .category-checkbox {
      width: 14px; height: 14px; cursor: pointer;
      accent-color: #2563eb;
      flex-shrink: 0;
    }
    .badge {
      margin-left: auto;
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 10px;
      white-space: nowrap;
      background: #fef3c7;
      color: #92400e;
    }
    footer {
      padding: 10px 16px;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <header>
    <h1>PIIGuard</h1>
    <div class="toggle-wrap">
      <span id="status-label">On</span>
      <label class="toggle">
        <input type="checkbox" id="master-toggle" checked />
        <span class="slider"></span>
      </label>
    </div>
  </header>

  <div id="rules-section">

    <!-- General -->
    <div class="category">
      <div class="category-header" id="header-general">
        <input type="checkbox" class="category-checkbox" id="cat-toggle-general" checked />
        <span class="category-title">General</span>
        <span class="category-arrow open" id="arrow-general">▼</span>
      </div>
      <div class="category-rules" id="cat-general">

        <div class="subgroup-header">
          <input type="checkbox" class="subgroup-checkbox" id="sub-toggle-identity" checked />
          <span class="subgroup-label">Identity</span>
        </div>
        <label class="rule-row">
          <input type="checkbox" id="rule-names" checked />
          Personal names
          <span id="ner-badge" style="display:none; margin-left:auto; font-size:10px; padding:1px 6px; border-radius:10px; white-space:nowrap; background:#dbeafe; color:#1e40af;">Loading…</span>
        </label>

        <div class="subgroup-header">
          <input type="checkbox" class="subgroup-checkbox" id="sub-toggle-contact" checked />
          <span class="subgroup-label">Contact</span>
        </div>
        <label class="rule-row">
          <input type="checkbox" id="rule-emails" checked />
          Email addresses
        </label>
        <label class="rule-row">
          <input type="checkbox" id="rule-phones" checked />
          Phone numbers
        </label>

        <div class="subgroup-header">
          <input type="checkbox" class="subgroup-checkbox" id="sub-toggle-financial" checked />
          <span class="subgroup-label">Financial</span>
        </div>
        <label class="rule-row">
          <input type="checkbox" id="rule-ibans" checked />
          IBANs
        </label>
        <label class="rule-row">
          <input type="checkbox" id="rule-creditCards" checked />
          Credit cards
        </label>

      </div>
    </div>

    <!-- Developer — coming soon -->
    <div class="category">
      <div class="category-header disabled">
        <input type="checkbox" class="category-checkbox" disabled />
        <span class="category-title">Developer</span>
        <span class="badge">Coming soon</span>
      </div>
    </div>

    <!-- Financial — coming soon -->
    <div class="category">
      <div class="category-header disabled">
        <input type="checkbox" class="category-checkbox" disabled />
        <span class="category-title">Financial</span>
        <span class="badge">Coming soon</span>
      </div>
    </div>

    <!-- Legal — coming soon -->
    <div class="category">
      <div class="category-header disabled">
        <input type="checkbox" class="category-checkbox" disabled />
        <span class="category-title">Legal</span>
        <span class="badge">Coming soon</span>
      </div>
    </div>

    <!-- Medical — coming soon -->
    <div class="category">
      <div class="category-header disabled">
        <input type="checkbox" class="category-checkbox" disabled />
        <span class="category-title">Medical</span>
        <span class="badge">Coming soon</span>
      </div>
    </div>

  </div>

  <footer>Running locally — no data leaves your device</footer>

  <script src="popup.js"></script>
</body>
</html>