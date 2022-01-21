import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
})
export class AboutPage implements OnInit {

  year: number;

  constructor() { }

  ngOnInit() {
    const now = new Date();
    this.year = now.getFullYear();
  }

}
