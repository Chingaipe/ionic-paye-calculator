import { Component, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

interface Info {
  napsa: number;
  nhima: number;
  exempt: number;
  totalDeduc: number;
  contributions: number;
  taxDeduc: number;
  takeHome: number;
}

interface TaxInfo {
  band: string;
  percentage: string;
  amount: number;
  dues: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  isOpen: false;
  isDark = false;
  taxForm: FormGroup;
  info: Info = {
    napsa: 0,
    nhima: 0,
    exempt: 4500,
    totalDeduc: 0,
    contributions: 0,
    taxDeduc: 0,
    takeHome: 0,
  };
  grossPay = 0;
  taxBandDues: number[] = [];
  taxInfo: TaxInfo[] = [];

  rates = [0.25, 0.3, 0.375]; // taxable band rates 25%, 30% & 37.5%
  taxBands = [300, 2100]; // taxable incomes at bands 25% & 30% respectivily
  napsaRate = 0.05; // 5%
  nhimaRate = 0.01; // 1%
  napsaCeiling = 1221.80; // napsa contribution ceiling

  constructor(
    private fb: FormBuilder,
    private render: Renderer2,
  ) {
    this.taxForm = this.fb.group({
      basic: '',
      allowances: '',
      otherDeducs: '',
    });
  }

  onSubmit() {
    this.reset();

    this.grossPay = this.getRemuneration();

    this.info.napsa = this.calcNapsa(this.grossPay);
    this.info.nhima = this.calculateNhima(this.taxForm.value.basic);
    this.info.contributions = this.getTotalContributions();

    if (this.isTaxable(this.grossPay)) {
      // for those above the band 0
      const taxable = this.getTaxableIncome(this.grossPay);
      const taxDues = this.calculateTaxes(taxable);

      this.info.taxDeduc = taxDues;
      this.info.totalDeduc = taxDues + this.info.contributions;
      this.info.takeHome = this.grossPay - this.info.totalDeduc;
    } else {
      // for those below band 0
      this.info.totalDeduc = this.info.contributions;
      this.info.takeHome = this.grossPay - this.info.contributions;
    }

    this.setTaxInfo();
  }

  reset() {
    // this.taxForm.reset();
    this.taxBandDues = [];
    this.taxInfo = []; // clear the array in case of recalculation
    this.grossPay = 0;
    this.info = {
      napsa: 0,
      nhima: 0,
      exempt: 4500,
      totalDeduc: 0,
      contributions: 0,
      taxDeduc: 0,
      takeHome: 0,
    };
  }

  clearContent(): void {
    this.taxForm.reset();
    this.reset();
  }

  /**
   * Sets the tax info data on tax calculation
   */
  setTaxInfo(): void {
    const band0: TaxInfo = {
      band: '1',
      percentage: '0%',
      amount: this.info.exempt,
      dues: '0.00'
    };

    if (this.isTaxable(this.grossPay)) {
      const band1: TaxInfo = {
        band: '2',
        percentage: '25%',
        amount: this.taxBands[0],
        dues: (this.taxBandDues[0]).toFixed(2),
      };
      const band2: TaxInfo = {
        band: '3',
        percentage: '30%',
        amount: this.taxBands[1],
        dues: (this.taxBandDues[1]).toFixed(2),
      };
      const band3: TaxInfo = {
        band: '4',
        percentage: '37.5%',
        amount: this.getBand3Amount(this.taxBandDues[2]),
        dues: (this.taxBandDues[2]).toFixed(2),
      };
      this.taxInfo.push(band0, band1, band2, band3);
    } else {
      this.taxInfo.push(band0);
    }
  }

  getBand3Amount(due: number): number {
    if (due) {
      const ans = due / this.rates[2]; // rate[2] being 0.375
      return Number(ans.toFixed(2));
    }

    return 0;
  }

  /**
   * Returns the total remuneration
   * @returns total remuneration
   */
  getRemuneration(): number {
    const input = this.taxForm.value;
    return input.basic + input.allowances;
  }

  /**
   * gets the taxable income
   * @param salary total remuneration
   * @returns income minus exempt amount
   */
  getTaxableIncome(salary: number): number {
    return salary - this.info.exempt;
  }

  getTotalContributions() {
    const input = this.taxForm.value;
    return this.info.napsa + this.info.nhima + Number(input.otherDeducs);
  }

  /**
   * Calculates the napsa amount considering the ceiling as well
   * @param salary Salary input by user
   * @returns NAPSA contribution amount
   */
  calcNapsa(salary: number): number {
    const napsa = salary * this.napsaRate;
    return napsa > this.napsaCeiling ? this.napsaCeiling : napsa;
  }

  /**
   * Calculates the nhima contribution amount
   * @param salary Salary input by user
   * @returns NHIMA contribution amount
   */
  calculateNhima(salary: number): number {
    return salary * this.nhimaRate;
  }

  /**
   * Calculates the taxes due
   * @param salary Taxable salary minus the exempt amount
   * @returns retrun the taxes due and tax band dues
   */
  calculateTaxes(salary: number): number {
    if (salary <= this.taxBands[0]) {
      this.taxBandDues[0] = salary * this.rates[0];
      return this.taxBandDues[0];
    }
    if (salary <= this.taxBands[1]) {
      this.taxBandDues[0] = this.taxBands[0] * this.rates[0];
      this.taxBandDues[1] = (salary - this.taxBands[0]) * this.rates[1];

      return this.taxBandDues[0] + this.taxBandDues[1];
    }
    if (salary > (this.taxBands[0] + this.taxBands[1])) {
      this.taxBandDues[0] = this.taxBands[0] * this.rates[0];
      this.taxBandDues[1] = this.taxBands[1] * this.rates[1];
      this.taxBandDues[2] = (salary - (this.taxBands[0] + this.taxBands[1])) * this.rates[2];

      return this.taxBandDues[0] + this.taxBandDues[1] + this.taxBandDues[2];
    }

    return this.taxBandDues[0] + this.taxBandDues[1] + this.taxBandDues[2];
  }

  /**
   * Checks is a given salary is taxable
   * @param salary Salary input by user
   * @returns True if taxable (above exempt amount)
   */
  isTaxable(salary: number): boolean {
    return salary > this.info.exempt;
  }

  /**
   * Formats a value to currency format
   * @param value Amount to convert to currency format
   * @returns Format currency string
   */
  currency(value: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'ZMW',
      // currencyDisplay: 'narrowSymbol',
    }).format(value);
  }

  toggleTheme() {
    this.isDark = !this.isDark;

    if (this.isDark) {
      this.render.setAttribute(document.body, 'color-theme', 'dark');
    } else {
      this.render.setAttribute(document.body, 'color-theme', 'light');
    }
  }

}
