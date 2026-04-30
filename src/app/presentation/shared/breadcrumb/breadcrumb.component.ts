import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

interface BreadcrumbItem {
  label: string;
  url?: string;
  isLast: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  breadcrumbs = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.buildBreadcrumbs())
    ),
    { initialValue: [] as BreadcrumbItem[] }
  );

  private buildBreadcrumbs(): BreadcrumbItem[] {
    try {
      let route: ActivatedRoute | null = this.activatedRoute.root;
      let items: { label: string; url?: string }[] = [];

      while (route) {
        const data = route.snapshot.data;
        if (data['breadcrumbs']) {
          items = data['breadcrumbs'];
        }
        route = route.firstChild;
      }

      if (!items.length) return [];

      return items.map((item, i) => ({
        label: item.label,
        url: item.url,
        isLast: i === items.length - 1,
      }));
    } catch {
      return [];
    }
  }
}
