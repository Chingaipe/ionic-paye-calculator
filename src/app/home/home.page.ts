import { Component } from '@angular/core';
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
  dues: number;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  isOpen: false;
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
  taxBandDues: number[] = [];
  taxInfo: TaxInfo[] = [];

  rates = [0.25, 0.3, 0.375];
  taxBands = [300, 2100];
  napsaRate = 0.05; // 5%
  nhimaRate = 0.01; // 1%
  napsaCeiling = 1221.80;

  constructor(
    private fb: FormBuilder,
  ) {
    this.taxForm = this.fb.group({
      basic: '',
      allowances: '',
      otherDeducs: '',
    });
  }

  onSubmit() {
    const remuneration = this.getRemuneration();

    this.info.napsa = this.calcNapsa(remuneration);
    this.info.nhima = this.calculateNhima(this.taxForm.value.basic);
    this.info.contributions = this.getTotalContributions();

    if (this.isTaxable(remuneration)) {
      // for those above the band 0
      const taxable = this.getTaxableIncome(remuneration);
      const taxDues = this.calculateTaxes(taxable);

      this.info.taxDeduc = taxDues;
      this.info.totalDeduc = taxDues + this.info.contributions;
      this.info.takeHome = remuneration - this.info.totalDeduc;
    } else {
      // for those below band 0
      this.info.takeHome = remuneration - this.info.contributions;
    }

    this.setTaxInfo();
    console.log(JSON.stringify(this.info));
    console.log(JSON.stringify(this.taxBandDues));
    console.log(JSON.stringify(this.taxForm.value));
  }

  setTaxInfo() {
    const band0: TaxInfo = {
      band: '1',
      percentage: '0%',
      amount: this.info.exempt,
      dues: 0
    };
    const band1: TaxInfo = {
      band: '2',
      percentage: '25%',
      amount: this.taxBands[0],
      dues: this.taxBandDues[0],
    };
    const band2: TaxInfo = {
      band: '3',
      percentage: '30%',
      amount: this.taxBands[1],
      dues: this.taxBandDues[1],
    };
    const band3: TaxInfo = {
      band: '4',
      percentage: '37.5%',
      amount: 0,
      dues: this.taxBandDues[2],
    };
    this.taxInfo.push(band0, band1, band2, band3);
  }

  /**
   * Returns the total remuneration
   * @returns total remuneration
   */
  getRemuneration(): number {
    const input = this.taxForm.value;
    return input.basic + input.allowances;
  }

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
    console.log(salary);
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
      currencyDisplay: 'narrowSymbol',
    }).format(value);
  }

  toggleTheme(event) {
    const systemDark = window.matchMedia('prefers-color-scheme: dark');
  }

}
