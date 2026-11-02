# Tel Aviv View | history connector

This is an **isolated** Cloudflare Worker prototype. It does not modify the production `momentum-yahoo-prices` Worker used by Wall Street View.

## Deployment
Create a **separate** Cloudflare Worker (suggested name `tel-aviv-history`). Paste `worker/history-worker.js` into its editor and deploy only after reviewing data-source authorization. Do not overwrite any existing Worker.

Set the history endpoint in the site using `?history_endpoint=https://YOUR-NEW-WORKER.workers.dev/` for initial testing. The public site continues to use the original Worker for current quotes.

## Verification
- `/?tech=LUMI.TA`: JSON `tech.LUMI.TA.t` and `c` should hold aligned timestamps and closing prices.
- `/?tech=LUMI.TA,POLI.TA,DSCT.TA`: up to three securities.
- Verify daily close values, dates, currency/units, split adjustments, missing bars, market holidays and differences from official TASE data.
- Confirm legal rights to collect and publicly redistribute the data. Yahoo's personal-use interfaces do **not** by themselves authorize public redistribution.
- Only after successful tests, configure a stable production endpoint and update the site so no manual URL parameter is needed.

## Current limitation
The standalone Worker is prepared in GitHub but **not deployed**. Year-long raw history does not necessarily represent total returns because dividends and corporate actions are not fully handled. Price returns must be identified as such.
