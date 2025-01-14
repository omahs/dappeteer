import { TransactionOptions } from "..";
import {
  clickOnButton,
  getElementByContent,
  retry,
  typeOnInputField,
  waitForOverlay,
} from "../helpers";
import { DappeteerPage } from "../page";

import { GetSingedIn } from "./index";

const MIN_GAS = 21000;

export const confirmTransaction =
  (page: DappeteerPage, getSingedIn: GetSingedIn) =>
  async (options?: TransactionOptions): Promise<void> => {
    await page.bringToFront();
    if (!(await getSingedIn())) {
      throw new Error("You haven't signed in yet");
    }

    //retry till we get prompt
    await retry(async () => {
      await page.bringToFront();
      await page.reload();
      await waitForOverlay(page);
      await getElementByContent(page, "Edit", "button", {
        timeout: 500,
        visible: false,
      });
    }, 15);

    if (options) {
      await clickOnButton(page, "Edit");
      await clickOnButton(page, "Edit suggested gas fee");
      //non EIP1559 networks don't have priority fee. TODO: run separate Ganache with older hardfork to test this
      let priority = false;
      if (options.priority) {
        priority = await typeOnInputField(
          page,
          "Max priority fee",
          String(options.priority),
          true,
          true,
          true
        );
      }
      if (options.gasLimit && options.gasLimit >= MIN_GAS)
        await typeOnInputField(
          page,
          "Gas Limit",
          String(options.gasLimit),
          true
        );
      if (options.gas && options.gasLimit >= MIN_GAS)
        await typeOnInputField(
          page,
          priority ? "Max fee" : "Gas Limit",
          String(options.gasLimit),
          true
        );

      await clickOnButton(page, "Save");
    }

    await page.waitForSelector(
      '[data-testid="page-container-footer-next"]:not([disabled])'
    );
    await clickOnButton(page, "Confirm");
  };
