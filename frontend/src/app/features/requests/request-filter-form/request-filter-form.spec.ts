import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RequestStatus, RequestType } from '../../../core/models/request.model';
import { RequestFilterForm } from './request-filter-form';

describe('RequestFilterForm', () => {
  let component: RequestFilterForm;
  let fixture: ComponentFixture<RequestFilterForm>;
  let form: HTMLFormElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestFilterForm],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestFilterForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    form = (fixture.nativeElement as HTMLElement).querySelector('form')!;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('submitting the form emits the entered filters and does not cause a real page submit', () => {
    const requestNumberInput = form.querySelector<HTMLInputElement>('#requestNumber')!;
    requestNumberInput.value = 'REQ-0001';
    requestNumberInput.dispatchEvent(new Event('input', { bubbles: true }));

    const newStatusCheckbox = Array.from(
      form.querySelectorAll<HTMLInputElement>('input[type=checkbox]'),
    ).find((c) => c.closest('label')?.textContent?.trim() === 'New')!;
    newStatusCheckbox.checked = true;
    newStatusCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    let emitted: unknown;
    component.search.subscribe((value) => (emitted = value));

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(emitted).toEqual({
      requestNumber: 'REQ-0001',
      statuses: [RequestStatus.New],
      types: [] as RequestType[],
      createdFrom: null,
      createdTo: null,
    });
  });

  it('flags a request number containing characters that could never match, and blocks submit', () => {
    const requestNumberInput = form.querySelector<HTMLInputElement>('#requestNumber')!;
    requestNumberInput.value = 'כעכע';
    requestNumberInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(requestNumberInput.classList.contains('invalid')).toBe(true);
    expect(requestNumberInput.getAttribute('aria-invalid')).toBe('true');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'can only contain letters, digits and hyphens',
    );
    expect(form.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(true);

    let emitted: unknown;
    component.search.subscribe((value) => (emitted = value));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(emitted).toBeUndefined();
  });

  it('accepts letters, digits and hyphens in the request number', () => {
    const requestNumberInput = form.querySelector<HTMLInputElement>('#requestNumber')!;
    requestNumberInput.value = 'REQ-000123';
    requestNumberInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(requestNumberInput.classList.contains('invalid')).toBe(false);
    expect(form.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(false);
  });

  it('rejects a "created from" date after "created to" without emitting', () => {
    const [fromInput, toInput] = Array.from(form.querySelectorAll<HTMLInputElement>('input[type=date]'));
    fromInput.value = '2025-06-01';
    fromInput.dispatchEvent(new Event('input', { bubbles: true }));
    toInput.value = '2025-01-01';
    toInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    let emitted: unknown;
    component.search.subscribe((value) => (emitted = value));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(emitted).toBeUndefined();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'must be on or before',
    );
  });

  it('clear resets the form and emits empty filters', () => {
    const requestNumberInput = form.querySelector<HTMLInputElement>('#requestNumber')!;
    requestNumberInput.value = 'REQ-0001';
    requestNumberInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    let emitted: unknown;
    component.search.subscribe((value) => (emitted = value));
    form.querySelector<HTMLButtonElement>('button[type=button]')!.click();
    fixture.detectChanges();

    expect(emitted).toEqual({
      requestNumber: '',
      statuses: [],
      types: [],
      createdFrom: null,
      createdTo: null,
    });
    expect(requestNumberInput.value).toBe('');
  });
});
