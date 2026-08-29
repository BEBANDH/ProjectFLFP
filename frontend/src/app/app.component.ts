import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app-layout">
      <!-- TODO: Add Sidebar Component Here -->
      <aside class="sidebar">
        <h2>FLFP</h2>
        <nav>
          <ul>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/expenses">Expenses</a></li>
            <li><a href="/credits">Credits (Income)</a></li>
            <li><a href="/investments">Investments</a></li>
          </ul>
        </nav>
      </aside>

      <main class="main-content">
        <!-- TODO: Add Navbar Component Here -->
        <header class="navbar">
          <span>Forward-Looking Finance Portfolio</span>
        </header>

        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}
