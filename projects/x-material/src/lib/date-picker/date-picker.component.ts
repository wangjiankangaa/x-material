/* tslint:disable:cyclomatic-complexity no-magic-numbers */
import moment, { DurationInputArg1, Moment } from 'moment';

import {
    ChangeDetectorRef, Component, ElementRef, EventEmitter, forwardRef, HostListener, Input, OnInit,
    Output, ViewChild, ViewEncapsulation
} from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';

import { defaultRangesConfig, LocaleConfig, Ranges } from './date-picker.config';
import { LocaleService } from './locale.service';

export enum SideEnum {
  left = 'left',
  right = 'right',
}

export interface XMatSelectedDate {
  chosenLabel: string;
  startDate: Moment;
  endDate: Moment;
}

@Component({
  selector: 'x-mat-date-picker',
  styleUrls: ['./date-picker.component.scss'],
  templateUrl: './date-picker.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => XMatDatePickerComponent),
      multi: true,
    },
  ],
})
export class XMatDatePickerComponent implements OnInit {
  chosenLabel: string;

  // tslint:disable-next-line:no-any
  calendarVariables: { left: any; right: any } = { left: {}, right: {} };

  /**
   * @description for storing tool tip text
   */
  toolTipText: string[] = [];

  // tslint:disable-next-line:no-any
  timePickerVariables: { left: any; right: any } = { left: {}, right: {} };

  dateRangePicker: { start: FormControl; end: FormControl } = { start: new FormControl(), end: new FormControl() };

  applyBtn: { disabled: boolean } = { disabled: false };

  // used in template for compile time support of enum values.
  sideEnum = SideEnum;

  chosenRange: string;

  rangesArray: string[] = [];

  // some state information
  isShown = false;

  inline = true;

  // tslint:disable-next-line:no-any
  leftCalendar: any = {};

  // tslint:disable-next-line:no-any
  rightCalendar: any = {};

  showCalInRanges = false;

  nowHoveredDate = null;

  pickingDate = false;

  /**
   * should get some options from user;
   */
  // tslint:disable-next-line:no-any
  options: any = {};

  _ranges: Ranges = {};

  _locale: LocaleConfig = {};

  /**
   * @description range start date
   */
  @Input() startDate = moment().startOf('day');

  /**
   * @description range end date
   */
  @Input() endDate = moment().endOf('day');

  /**
   * @description set max number of the date we can choose
   */
  @Input() dateLimit = null;

  /**
   * @description minimal date
   */
  @Input() minDate: Moment = null;

  /**
   * @description maximal date
   */
  @Input() maxDate: Moment = null;

  /**
   * @description auto select date without apply button
   */
  @Input() autoApply = false;

  /**
   * @description is single date picker mode
   */
  @Input() isRangePicker = false;

  /**
   * @description display clear button or not
   */
  @Input() showClearButton = false;

  /**
   * @description month year dropdown available
   */
  @Input() showDropdown = false;

  /**
   * @description week number of the year
   */
  @Input() showWeekNumbers = false;

  /**
   * @description iso week number of the year
   */
  @Input() showISOWeekNumbers = false;

  /**
   * @description display cancel button or not
   */
  @Input() showCancel = false;

  /**
   * @description link the control buttons of the calendars
   */
  @Input() linkedCalendars = false;

  /**
   * @ignore
   */
  @Input() autoUpdateInput = true;

  /**
   * @ignore
   */
  @Input() maxSpan: DurationInputArg1 = null;

  /**
   * @description set to enable timer picker;
   */
  @Input() timePicker = false;

  /**
   * @description set to true if you want to set the time picker to 24h instead of having AM and PM
   * Available only if timePicker is set to true
   */
  @Input() timePicker24Hour = false;

  /**
   * @description set the value increment of the minutes
   * Available only if timePicker is set to true
   */
  @Input() timePickerIncrement = 1;

  /**
   * @description set true if you want do display second's select
   * Available only if timePicker is set to true
   */
  @Input() timePickerSeconds = false;

  /**
   * @description add a custom class for all first day of the month
   */
  @Input() firstMonthDayClass: string = null;

  /**
   * @description add a custom class for all last day of the month
   */
  @Input() lastMonthDayClass: string = null;

  /**
   * @description add a custom class for all date in a week not in the current month
   */
  @Input() emptyWeekRowClass: string = null;

  /**
   * @description add a custom class for the first day of the next month
   */
  @Input() firstDayOfNextMonthClass: string = null;

  /**
   * @description add a custom class for the last day of the previous month
   */
  @Input() lastDayOfPreviousMonthClass: string = null;

  /**
   * @description set to true if you want to display the ranges with the calendar.
   * Available only if the ranges is set.
   */
  @Input() alwaysShowCalendars = false;

  /**
   * @description set to true if you want the calendar won't be closed after choosing a range
   * Available only if the ranges is set.
   */
  @Input() keepCalendarOpeningWithRange = false;

  /**
   * @description set to true if you want to display the range label on input
   * Available only if the ranges is set.
   */
  @Input() showRangeLabelOnInput = false;

  /**
   * @description set to true if you want to allow selection range from end date first
   * Available only if the ranges is set.
   */
  @Input() customRangeDirection = false;

  /**
   * @description set to true if you want to lock start date and change only the end date
   * Available only if the ranges is set.
   */
  @Input() lockStartDate = false;

  /**
   * @description display custom range label
   */
  @Input() showCustomRangeLabel: boolean;

  /**
   * @description position the calendar to the up or down form the input element;
   */
  @Input() positionY: 'up' | 'down' = 'down';

  /**
   * @description position the calendar form the input element;
   */
  @Input() positionX: 'left' | 'center' | 'right' | 'auto' = 'auto';

  /**
   * @description close the calendar immediately as soon as date selected
   */
  @Input() closeOnAutoApply = true;

  @Output() selectedDate: EventEmitter<XMatSelectedDate> = new EventEmitter();

  /**
   * @description Fired when clicked on range, and send an object with range label and dates value
   */
  @Output() rangeClicked: EventEmitter<{ label: string; dates: [Moment, Moment] }> = new EventEmitter();

  /**
   * @description Fires when the date model is updated, like applying (if you have activated the apply button),
   * or when selecting a range or date without the apply button, and sends an object containing start and end date,
   * eg: { startDate: Moment, endDate: Moment }
   */
  @Output() datesUpdated: EventEmitter<Omit<XMatSelectedDate, 'chosenLabel'>> = new EventEmitter();

  @Output() startDateChanged: EventEmitter<Pick<XMatSelectedDate, 'startDate'>> = new EventEmitter();

  @Output() endDateChanged: EventEmitter<Pick<XMatSelectedDate, 'endDate'>> = new EventEmitter();

  @ViewChild('pickerContainer', { static: true }) pickerContainer: ElementRef;

  private _old: { start: Moment; end: Moment } = { start: null, end: null };

  constructor(private _ref: ChangeDetectorRef, private _localeService: LocaleService) {}

  /**
   * @param date Moment
   * @return default is false means all dates are valid.
   * @description A function that is passed each date in calendar(or calendars at date range picker mode) before they are displayed,
   * and may return true or false to indicate whether that date should be available for selection or not.
   */
  @Input() isInvalidDate(_: Moment): boolean {
    return false;
  }

  /**
   * @param date Moment
   * @returns false: do nothing; string or string[]: add custom css class(classes) to the date
   * @description A function that is passed each date in the calendars before they are displayed,
   * and may return a string or array of CSS class names to apply to that date's calendar cell
   */
  @Input() isCustomDate(_: Moment): false | string | string[] {
    return false;
  }

  /**
   * @param date Moment
   * @returns text tooltip message; default is null;
   * @description A function that is passed each date in the two calendars before they are displayed,
   * and may return a text to be displayed as a tooltip.
   */
  @Input() addTooltipForDate(_: Moment): string {
    return null;
  }
  /**
   * @description locale config object
   */
  @Input() set locale(value: LocaleConfig) {
    this._locale = { ...this._localeService.config, ...value };
  }

  get locale(): LocaleConfig {
    return this._locale;
  }

  /**
   * @description Set predefined date ranges the user can select from.
   * Each key is the label for the range, and its value an array with two dates representing the bounds of the range
   *
   * @example
   * ```ts
   * const ranges: Ranges = {
   *  'Today': [moment(), moment()],
   *  'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
   *  'Last 7 Days': [moment().subtract(6, 'days'), moment()],
   *  'Last 30 Days': [moment().subtract(29, 'days'), moment()],
   *  'This Month': [moment().startOf('month'), moment().endOf('month')],
   *  'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
   * }
   * ```
   */
  @Input() set ranges(value: Ranges | true) {
    if (value === true) {
      this._ranges = defaultRangesConfig;
      this.showCustomRangeLabel = true;
    }

    if (typeof value === 'object') {
      this._ranges = value;
    }

    this.renderRanges();
  }

  get ranges(): Ranges | true {
    return this._ranges;
  }

  @HostListener('click', ['$event']) onHostClicked(event) {
    this.handleInternalClick(event);
  }

  ngOnInit() {
    this._buildLocale();

    const daysOfWeek = [...this.locale.daysOfWeek];

    this.locale.firstDay = this.locale.firstDay % 7;

    if (this.locale.firstDay !== 0) {
      let iterator = this.locale.firstDay;

      while (iterator > 0) {
        daysOfWeek.push(daysOfWeek.shift());
        iterator--;
      }
    }

    this.locale.daysOfWeek = daysOfWeek;

    if (this.inline) {
      this._old.start = this.startDate.clone();
      this._old.end = this.endDate.clone();
    }

    if (this.startDate && this.timePicker) {
      this.setStartDate(this.startDate);
      this.renderTimePicker(SideEnum.left);
    }

    if (this.endDate && this.timePicker) {
      this.setEndDate(this.endDate);
      this.renderTimePicker(SideEnum.right);
    }

    this.updateMonthsInView();
    this.renderCalendar(SideEnum.left);
    this.renderCalendar(SideEnum.right);
    this.renderRanges();
  }

  renderRanges() {
    this.rangesArray = [];

    let start: Moment;
    let end: Moment;

    if (typeof this.ranges === 'object') {
      for (const range in this.ranges) {
        if (this.ranges[range]) {
          start =
            typeof this.ranges[range][0] === 'string'
              ? moment(this.ranges[range][0], this.locale.format)
              : moment(this.ranges[range][0]);
          end =
            typeof this.ranges[range][1] === 'string'
              ? moment(this.ranges[range][1], this.locale.format)
              : moment(this.ranges[range][1]);

          // If the start or end date exceed those allowed by the minDate or maxSpan
          // options, shorten the range to the allowable period.
          if (this.minDate && start.isBefore(this.minDate)) {
            start = this.minDate.clone();
          }

          let maxDate = this.maxDate;

          if (
            this.maxSpan &&
            maxDate &&
            start
              .clone()
              .add(this.maxSpan)
              .isAfter(maxDate)
          ) {
            maxDate = start.clone().add(this.maxSpan);
          }

          if (maxDate && end.isAfter(maxDate)) {
            end = maxDate.clone();
          }

          // If the end of the range is before the minimum or the start of the range is
          // after the maximum, don't display this range option at all.
          if (
            (this.minDate && end.isBefore(this.minDate, this.timePicker ? 'minute' : 'day')) ||
            (maxDate && start.isAfter(maxDate, this.timePicker ? 'minute' : 'day'))
          ) {
            continue;
          }

          // Support unicode chars in the range names.
          const elem = document.createElement('textarea');

          elem.innerHTML = range;

          const rangeHtml = elem.value;

          this.ranges[rangeHtml] = [start, end];
        }
      }

      for (const range in this.ranges) {
        if (this.ranges[range]) {
          this.rangesArray.push(range);
        }
      }

      if (this.showCustomRangeLabel) {
        this.rangesArray.push(this.locale.customRangeLabel);
      }

      this.showCalInRanges = !this.rangesArray.length || this.alwaysShowCalendars;

      if (!this.timePicker) {
        this.startDate = this.startDate.startOf('day');
        this.endDate = this.endDate.endOf('day');
      }
    }
  }

  renderTimePicker(side: SideEnum): void {
    let selected: Moment;
    let minDate: Moment;
    const maxDate = this.maxDate;

    if (side === SideEnum.left) {
      (selected = this.startDate.clone()), (minDate = this.minDate);
    } else if (side === SideEnum.right && this.endDate) {
      (selected = this.endDate.clone()), (minDate = this.startDate);
    } else if (side === SideEnum.right && !this.endDate) {
      // don't have an end date, use the start date then put the selected time for the right side as the time
      selected = this._getDateWithTime(this.startDate, SideEnum.right);
      if (selected.isBefore(this.startDate)) {
        selected = this.startDate.clone(); // set it back to the start date the time was backwards
      }
      minDate = this.startDate;
    }

    const start = this.timePicker24Hour ? 0 : 1;
    const end = this.timePicker24Hour ? 23 : 12;

    this.timePickerVariables[side] = {
      hours: [],
      minutes: [],
      minutesLabel: [],
      seconds: [],
      secondsLabel: [],
      disabledHours: [],
      disabledMinutes: [],
      disabledSeconds: [],
      selectedHour: 0,
      selectedMinute: 0,
      selectedSecond: 0,
    };

    // generate hours
    for (let i = start; i <= end; i++) {
      let iIn24 = i;

      if (!this.timePicker24Hour) {
        iIn24 = selected.hour() >= 12 ? (i === 12 ? 12 : i + 12) : i === 12 ? 0 : i;
      }

      const time = selected.clone().hour(iIn24);
      let disabled = false;
      if (minDate && time.minute(59).isBefore(minDate)) {
        disabled = true;
      }
      if (maxDate && time.minute(0).isAfter(maxDate)) {
        disabled = true;
      }

      this.timePickerVariables[side].hours.push(i);
      if (iIn24 === selected.hour() && !disabled) {
        this.timePickerVariables[side].selectedHour = i;
      } else if (disabled) {
        this.timePickerVariables[side].disabledHours.push(i);
      }
    }

    // generate minutes
    for (let i = 0; i < 60; i += this.timePickerIncrement) {
      const padded = i < 10 ? '0' + i : i;
      const time = selected.clone().minute(i);

      let disabled = false;
      if (minDate && time.second(59).isBefore(minDate)) {
        disabled = true;
      }
      if (maxDate && time.second(0).isAfter(maxDate)) {
        disabled = true;
      }
      this.timePickerVariables[side].minutes.push(i);
      this.timePickerVariables[side].minutesLabel.push(padded);
      if (selected.minute() === i && !disabled) {
        this.timePickerVariables[side].selectedMinute = i;
      } else if (disabled) {
        this.timePickerVariables[side].disabledMinutes.push(i);
      }
    }
    // generate seconds
    if (this.timePickerSeconds) {
      for (let i = 0; i < 60; i++) {
        const padded = i < 10 ? '0' + i : i;
        const time = selected.clone().second(i);

        let disabled = false;
        if (minDate && time.isBefore(minDate)) {
          disabled = true;
        }
        if (maxDate && time.isAfter(maxDate)) {
          disabled = true;
        }

        this.timePickerVariables[side].seconds.push(i);
        this.timePickerVariables[side].secondsLabel.push(padded);
        if (selected.second() === i && !disabled) {
          this.timePickerVariables[side].selectedSecond = i;
        } else if (disabled) {
          this.timePickerVariables[side].disabledSeconds.push(i);
        }
      }
    }

    // generate AM/PM
    if (!this.timePicker24Hour) {
      if (
        minDate &&
        selected
          .clone()
          .hour(12)
          .minute(0)
          .second(0)
          .isBefore(minDate)
      ) {
        this.timePickerVariables[side].amDisabled = true;
      }

      if (
        maxDate &&
        selected
          .clone()
          .hour(0)
          .minute(0)
          .second(0)
          .isAfter(maxDate)
      ) {
        this.timePickerVariables[side].pmDisabled = true;
      }

      this.timePickerVariables[side].ampmModel = selected.hour() >= 12 ? 'PM' : 'AM';
    }

    this.timePickerVariables[side].selected = selected;
  }

  renderCalendar(side: SideEnum) {
    // side enum
    // tslint:disable-next-line:no-any
    const mainCalendar: any = side === SideEnum.left ? this.leftCalendar : this.rightCalendar;
    const month = mainCalendar.month.month();
    const year = mainCalendar.month.year();
    const hour = mainCalendar.month.hour();
    const minute = mainCalendar.month.minute();
    const second = mainCalendar.month.second();
    const daysInMonth = moment([year, month]).daysInMonth();
    const firstDay = moment([year, month, 1]);
    const lastDay = moment([year, month, daysInMonth]);
    const lastMonth = moment(firstDay)
      .subtract(1, 'month')
      .month();
    const lastYear = moment(firstDay)
      .subtract(1, 'month')
      .year();
    const daysInLastMonth = moment([lastYear, lastMonth]).daysInMonth();
    const dayOfWeek = firstDay.day();
    // tslint:disable-next-line:no-any
    const calendar: any = []; // initialize a 6 rows x 7 columns array for the calendar

    calendar.firstDay = firstDay;
    calendar.lastDay = lastDay;

    for (let i = 0; i < 6; i++) {
      calendar[i] = [];
    }

    // populate the calendar with date objects
    let startDay = daysInLastMonth - dayOfWeek + this.locale.firstDay + 1;
    if (startDay > daysInLastMonth) {
      startDay -= 7;
    }

    if (dayOfWeek === this.locale.firstDay) {
      startDay = daysInLastMonth - 6;
    }

    let curDate = moment([lastYear, lastMonth, startDay, 12, minute, second]);

    // tslint:disable-next-line:one-variable-per-declaration
    for (let i = 0, col = 0, row = 0; i < 42; i++, col++, curDate = moment(curDate).add(24, 'hour')) {
      if (i > 0 && col % 7 === 0) {
        col = 0;
        row++;
      }
      calendar[row][col] = curDate
        .clone()
        .hour(hour)
        .minute(minute)
        .second(second);
      curDate.hour(12);

      if (
        this.minDate &&
        calendar[row][col].format('YYYY-MM-DD') === this.minDate.format('YYYY-MM-DD') &&
        calendar[row][col].isBefore(this.minDate) &&
        side === 'left'
      ) {
        calendar[row][col] = this.minDate.clone();
      }

      if (
        this.maxDate &&
        calendar[row][col].format('YYYY-MM-DD') === this.maxDate.format('YYYY-MM-DD') &&
        calendar[row][col].isAfter(this.maxDate) &&
        side === 'right'
      ) {
        calendar[row][col] = this.maxDate.clone();
      }
    }

    // make the calendar object available to hoverDate/clickDate
    if (side === SideEnum.left) {
      this.leftCalendar.calendar = calendar;
    } else {
      this.rightCalendar.calendar = calendar;
    }

    // Display the calendar
    const minDate = side === 'left' ? this.minDate : this.startDate;
    let maxDate = this.maxDate;

    // adjust maxDate to reflect the dateLimit setting in order to
    // grey out end dates beyond the dateLimit
    if (this.endDate === null && this.dateLimit) {
      const maxLimit = this.startDate
        .clone()
        .add(this.dateLimit, 'day')
        .endOf('day');
      if (!maxDate || maxLimit.isBefore(maxDate)) {
        maxDate = maxLimit;
      }
    }

    this.calendarVariables[side] = {
      month,
      year,
      hour,
      minute,
      second,
      daysInMonth,
      firstDay,
      lastDay,
      lastMonth,
      lastYear,
      daysInLastMonth,
      dayOfWeek,
      // other vars
      calRows: Array.from(Array(6).keys()),
      calCols: Array.from(Array(7).keys()),
      classes: {},
      minDate,
      maxDate,
      calendar,
    };

    if (this.showDropdown) {
      const currentMonth = calendar[1][1].month();
      const currentYear = calendar[1][1].year();
      const realCurrentYear = moment().year();
      const maxYear = (maxDate && maxDate.year()) || realCurrentYear + 5;
      const minYear = (minDate && minDate.year()) || realCurrentYear - 50;
      const inMinYear = currentYear === minYear;
      const inMaxYear = currentYear === maxYear;
      const years = [];

      for (let y = minYear; y <= maxYear; y++) {
        years.push(y);
      }

      this.calendarVariables[side].dropdowns = {
        currentMonth,
        currentYear,
        maxYear,
        minYear,
        inMinYear,
        inMaxYear,
        monthArrays: Array.from(Array(12).keys()),
        yearArrays: years,
      };
    }

    this._buildCells(calendar, side);
  }

  /**
   * @ignore
   */
  setStartDate(startDate: string | Moment): void {
    if (typeof startDate === 'string') {
      this.startDate = moment(startDate, this.locale.format);
    }

    if (typeof startDate === 'object') {
      this.pickingDate = true;
      this.startDate = moment(startDate);
    }

    if (!this.timePicker) {
      this.pickingDate = true;
      this.startDate = this.startDate.startOf('day');
    }

    if (this.timePicker && this.timePickerIncrement) {
      this.startDate.minute(Math.round(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);
    }

    if (this.minDate && this.startDate.isBefore(this.minDate)) {
      this.startDate = this.minDate.clone();
      if (this.timePicker && this.timePickerIncrement) {
        this.startDate.minute(
          Math.round(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement
        );
      }
    }

    if (this.maxDate && this.startDate.isAfter(this.maxDate)) {
      this.startDate = this.maxDate.clone();
      if (this.timePicker && this.timePickerIncrement) {
        this.startDate.minute(
          Math.floor(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement
        );
      }
    }

    if (!this.isShown) {
      this.updateElement();
    }

    this.startDateChanged.emit({ startDate: this.startDate });
    this.updateMonthsInView();
  }

  /**
   * @ignore
   */
  setEndDate(endDate: string | Moment) {
    if (typeof endDate === 'string') {
      this.endDate = moment(endDate, this.locale.format);
    }

    if (typeof endDate === 'object') {
      this.pickingDate = false;
      this.endDate = moment(endDate);
    }

    if (!this.timePicker) {
      this.pickingDate = false;
      this.endDate = this.endDate
        .add(1, 'd')
        .startOf('day')
        .subtract(1, 'second');
    }

    if (this.timePicker && this.timePickerIncrement) {
      this.endDate.minute(Math.round(this.endDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);
    }

    if (this.endDate.isBefore(this.startDate)) {
      this.endDate = this.startDate.clone();
    }

    if (this.maxDate && this.endDate.isAfter(this.maxDate)) {
      this.endDate = this.maxDate.clone();
    }

    if (
      this.dateLimit &&
      this.startDate
        .clone()
        .add(this.dateLimit, 'day')
        .isBefore(this.endDate)
    ) {
      this.endDate = this.startDate.clone().add(this.dateLimit, 'day');
    }

    if (!this.isShown) {
      // this.updateElement();
    }

    this.endDateChanged.emit({ endDate: this.endDate });
    this.updateMonthsInView();
  }

  updateView() {
    if (this.timePicker) {
      this.renderTimePicker(SideEnum.left);
      this.renderTimePicker(SideEnum.right);
    }
    this.updateMonthsInView();
    this.updateCalendars();
  }

  updateMonthsInView() {
    if (this.endDate) {
      // if both dates are visible already, do nothing
      if (
        this.isRangePicker &&
        this.leftCalendar.month &&
        this.rightCalendar.month &&
        ((this.startDate &&
          this.leftCalendar &&
          this.startDate.format('YYYY-MM') === this.leftCalendar.month.format('YYYY-MM')) ||
          (this.startDate &&
            this.rightCalendar &&
            this.startDate.format('YYYY-MM') === this.rightCalendar.month.format('YYYY-MM'))) &&
        (this.endDate.format('YYYY-MM') === this.leftCalendar.month.format('YYYY-MM') ||
          this.endDate.format('YYYY-MM') === this.rightCalendar.month.format('YYYY-MM'))
      ) {
        return;
      }

      if (this.startDate) {
        this.leftCalendar.month = this.startDate.clone().date(2);
        if (
          !this.linkedCalendars &&
          (this.endDate.month() !== this.startDate.month() || this.endDate.year() !== this.startDate.year())
        ) {
          this.rightCalendar.month = this.endDate.clone().date(2);
        } else {
          this.rightCalendar.month = this.startDate
            .clone()
            .date(2)
            .add(1, 'month');
        }
      }
    } else {
      if (
        this.leftCalendar.month.format('YYYY-MM') !== this.startDate.format('YYYY-MM') &&
        this.rightCalendar.month.format('YYYY-MM') !== this.startDate.format('YYYY-MM')
      ) {
        this.leftCalendar.month = this.startDate.clone().date(2);
        this.rightCalendar.month = this.startDate
          .clone()
          .date(2)
          .add(1, 'month');
      }
    }

    if (this.maxDate && this.linkedCalendars && this.isRangePicker && this.rightCalendar.month > this.maxDate) {
      this.rightCalendar.month = this.maxDate.clone().date(2);
      this.leftCalendar.month = this.maxDate
        .clone()
        .date(2)
        .subtract(1, 'month');
    }
  }

  /**
   *  This is responsible for updating the calendars
   */
  updateCalendars() {
    this.renderCalendar(SideEnum.left);
    this.renderCalendar(SideEnum.right);

    if (this.endDate === null) {
      return;
    }
    this.calculateChosenLabel();
  }

  updateElement() {
    const format = this.locale.displayFormat ? this.locale.displayFormat : this.locale.format;

    // tslint:disable-next-line:prefer-conditional-expression
    if (this.isRangePicker && this.autoUpdateInput) {
      if (this.startDate && this.endDate) {
        // if we use ranges and should show range label on input
        this.chosenLabel =
          this.rangesArray.length &&
          this.showRangeLabelOnInput === true &&
          this.chosenRange &&
          this.locale.customRangeLabel !== this.chosenRange
            ? this.chosenLabel
            : this.startDate.format(format) + this.locale.separator + this.endDate.format(format);
      }
    } else if (this.autoUpdateInput) {
      this.chosenLabel = this.startDate.format(format);
    }
  }

  remove() {
    this.isShown = false;
  }

  /**
   * this should calculate the label
   */
  calculateChosenLabel() {
    if (!this.locale || !this.locale.separator) {
      this._buildLocale();
    }

    let customRange = true;
    let i = 0;

    if (this.rangesArray.length > 0) {
      for (const range in this.ranges as Ranges) {
        if (this.ranges[range]) {
          if (this.timePicker) {
            const format = this.timePickerSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm';
            // ignore times when comparing dates if time picker seconds is not enabled
            if (
              this.startDate.format(format) === (<Moment>this.ranges[range][0]).format(format) &&
              this.endDate.format(format) === (<Moment>this.ranges[range][1]).format(format)
            ) {
              customRange = false;
              this.chosenRange = this.rangesArray[i];
              break;
            }
          } else {
            // ignore times when comparing dates if time picker is not enabled
            if (
              this.startDate.format('YYYY-MM-DD') === (<Moment>this.ranges[range][0]).format('YYYY-MM-DD') &&
              this.endDate.format('YYYY-MM-DD') === (<Moment>this.ranges[range][1]).format('YYYY-MM-DD')
            ) {
              customRange = false;
              this.chosenRange = this.rangesArray[i];
              break;
            }
          }
          i++;
        }
      }

      if (customRange) {
        this.chosenRange = this.showCustomRangeLabel ? this.locale.customRangeLabel : null;
        // if custom label: show calendar
        this.showCalInRanges = true;
      }
    }

    this.updateElement();
  }

  clickApply(event?: Event) {
    if (this.isRangePicker && this.startDate && !this.endDate) {
      this.endDate = this._getDateWithTime(this.startDate, SideEnum.right);

      this.calculateChosenLabel();
    }

    if (this.isInvalidDate && this.startDate && this.endDate) {
      // get if there are invalid date between range
      const startDate = this.startDate.clone();

      while (startDate.isBefore(this.endDate)) {
        if (this.isInvalidDate(startDate)) {
          this.endDate = startDate.subtract(1, 'days');
          this.calculateChosenLabel();
          break;
        }

        startDate.add(1, 'days');
      }
    }

    if (this.chosenLabel) {
      this.selectedDate.emit({ chosenLabel: this.chosenLabel, startDate: this.startDate, endDate: this.endDate });
    }

    this.datesUpdated.emit({ startDate: this.startDate, endDate: this.endDate });

    if (event || (this.closeOnAutoApply && !event)) {
      this.hide();
    }
  }

  clickCancel(_?: Event) {
    this.startDate = this._old.start;
    this.endDate = this._old.end;

    if (this.inline) {
      this.updateView();
    }

    this.hide();
  }

  /**
   * called when month is changed
   * @param monthEvent get value in event.target.value
   * @param side left or right
   */
  monthChanged(monthEvent: Event, side: SideEnum) {
    const year = this.calendarVariables[side].dropdowns.currentYear;
    const month = parseInt((<HTMLSelectElement>monthEvent.target).value, 10);

    this.monthOrYearChanged(month, year, side);
  }

  /**
   * called when year is changed
   * @param yearEvent get value in event.target.value
   * @param side left or right
   */
  // tslint:disable-next-line:no-any
  yearChanged(yearEvent: any, side: SideEnum) {
    const month = this.calendarVariables[side].dropdowns.currentMonth;
    const year = parseInt(yearEvent.target.value, 10);

    this.monthOrYearChanged(month, year, side);
  }

  /**
   * called when time is changed
   * @param timeEvent  an event
   * @param side left or right
   */
  timeChanged(timeEvent: Event, side: SideEnum) {
    let hour = parseInt(this.timePickerVariables[side].selectedHour, 10);
    const minute = parseInt(this.timePickerVariables[side].selectedMinute, 10);
    const second = this.timePickerSeconds ? parseInt(this.timePickerVariables[side].selectedSecond, 10) : 0;
    const compareHour = 12;

    if (!this.timePicker24Hour) {
      const ampm = this.timePickerVariables[side].ampmModel;

      if (ampm === 'PM' && hour < compareHour) {
        hour += compareHour;
      }
      if (ampm === 'AM' && hour === compareHour) {
        hour = 0;
      }
    }

    if (side === SideEnum.left) {
      const start = this.startDate.clone();
      start.hour(hour);
      start.minute(minute);
      start.second(second);
      this.setStartDate(start);
      if (!this.isRangePicker) {
        this.endDate = this.startDate.clone();
      } else if (
        this.endDate &&
        this.endDate.format('YYYY-MM-DD') === start.format('YYYY-MM-DD') &&
        this.endDate.isBefore(start)
      ) {
        this.setEndDate(start.clone());
      } else if (!this.endDate && this.timePicker) {
        const startClone = this._getDateWithTime(start, SideEnum.right);

        if (startClone.isBefore(start)) {
          this.timePickerVariables[SideEnum.right].selectedHour = hour;
          this.timePickerVariables[SideEnum.right].selectedMinute = minute;
          this.timePickerVariables[SideEnum.right].selectedSecond = second;
        }
      }
    } else if (this.endDate) {
      const end = this.endDate.clone();
      end.hour(hour);
      end.minute(minute);
      end.second(second);
      this.setEndDate(end);
    }

    // update the calendars so all clickable dates reflect the new time component
    this.updateCalendars();

    // re-render the time pickers because changing one selection can affect what's enabled in another
    this.renderTimePicker(SideEnum.left);
    this.renderTimePicker(SideEnum.right);

    if (this.autoApply) {
      this.clickApply();
    }
  }

  /**
   *  call when month or year changed
   * @param month month number 0 -11
   * @param year year eg: 1995
   * @param side left or right
   */
  monthOrYearChanged(month: number, year: number, side: SideEnum) {
    const isLeft = side === SideEnum.left;

    if (!isLeft) {
      if (year < this.startDate.year() || (year === this.startDate.year() && month < this.startDate.month())) {
        month = this.startDate.month();
        year = this.startDate.year();
      }
    }

    if (this.minDate) {
      if (year < this.minDate.year() || (year === this.minDate.year() && month < this.minDate.month())) {
        month = this.minDate.month();
        year = this.minDate.year();
      }
    }

    if (this.maxDate) {
      if (year > this.maxDate.year() || (year === this.maxDate.year() && month > this.maxDate.month())) {
        month = this.maxDate.month();
        year = this.maxDate.year();
      }
    }
    this.calendarVariables[side].dropdowns.currentYear = year;
    this.calendarVariables[side].dropdowns.currentMonth = month;
    if (isLeft) {
      this.leftCalendar.month.month(month).year(year);
      if (this.linkedCalendars) {
        this.rightCalendar.month = this.leftCalendar.month.clone().add(1, 'month');
      }
    } else {
      this.rightCalendar.month.month(month).year(year);
      if (this.linkedCalendars) {
        this.leftCalendar.month = this.rightCalendar.month.clone().subtract(1, 'month');
      }
    }
    this.updateCalendars();
  }

  /**
   * Click on previous month
   * @param side left or right calendar
   */
  clickPrev(side: SideEnum) {
    if (side === SideEnum.left) {
      this.leftCalendar.month.subtract(1, 'month');

      if (this.linkedCalendars) {
        this.rightCalendar.month.subtract(1, 'month');
      }
    } else {
      this.rightCalendar.month.subtract(1, 'month');
    }
    this.updateCalendars();
  }

  /**
   * Click on next month
   * @param side left or right calendar
   */
  clickNext(side: SideEnum) {
    if (side === SideEnum.left) {
      this.leftCalendar.month.add(1, 'month');
    } else {
      this.rightCalendar.month.add(1, 'month');
      if (this.linkedCalendars) {
        this.leftCalendar.month.add(1, 'month');
      }
    }
    this.updateCalendars();
  }

  /**
   * When hovering a date
   * @param e event: get value by e.target.value
   * @param side left or right
   * @param row row position of the current date clicked
   * @param col col position of the current date clicked
   */
  hoverDate(event: Event, side: SideEnum, row: number, col: number) {
    const leftCalDate = this.calendarVariables.left.calendar[row][col];
    const rightCalDate = this.calendarVariables.right.calendar[row][col];

    if (this.pickingDate) {
      this.nowHoveredDate = side === SideEnum.left ? leftCalDate : rightCalDate;
      this.renderCalendar(SideEnum.left);
      this.renderCalendar(SideEnum.right);
    }

    const tooltip = side === SideEnum.left ? this.toolTipText[leftCalDate] : this.toolTipText[rightCalDate];

    if (tooltip.length > 0) {
      (<HTMLTableDataCellElement>event.target).setAttribute('title', tooltip);
    }
  }

  /**
   * When selecting a date
   * @param side left or right
   * @param row row position of the current date clicked
   * @param col col position of the current date clicked
   */
  clickDate(e, side: SideEnum, row: number, col: number) {
    if (e.target.tagName === 'TD') {
      if (!e.target.classList.contains('available')) {
        return;
      }
    } else if (e.target.tagName === 'SPAN') {
      if (!e.target.parentElement.classList.contains('available')) {
        return;
      }
    }
    if (this.rangesArray.length) {
      this.chosenRange = this.locale.customRangeLabel;
    }

    let date = side === SideEnum.left ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

    if (
      (this.endDate || (date.isBefore(this.startDate, 'day') && this.customRangeDirection === false)) &&
      this.lockStartDate === false
    ) {
      // picking start
      if (this.timePicker) {
        date = this._getDateWithTime(date, SideEnum.left);
      }
      this.endDate = null;
      this.setStartDate(date.clone());
    } else if (!this.endDate && date.isBefore(this.startDate) && this.customRangeDirection === false) {
      // special case: clicking the same date for start/end,
      // but the time of the end date is before the start date
      this.setEndDate(this.startDate.clone());
    } else {
      // picking end
      if (this.timePicker) {
        date = this._getDateWithTime(date, SideEnum.right);
      }
      if (date.isBefore(this.startDate, 'day') === true && this.customRangeDirection === true) {
        this.setEndDate(this.startDate);
        this.setStartDate(date.clone());
      } else {
        this.setEndDate(date.clone());
      }

      if (this.autoApply) {
        this.calculateChosenLabel();
        this.clickApply();
      }
    }

    if (!this.isRangePicker) {
      this.setEndDate(this.startDate);
      this.updateElement();
      if (this.autoApply) {
        this.clickApply();
      }
    }

    this.updateView();

    if (this.autoApply && this.startDate && this.endDate) {
      this.clickApply();
    }

    // This is to cancel the blur event handler if the mouse was in one of the inputs
    e.stopPropagation();
  }

  /**
   *  Click on the custom range
   */
  clickRange(_: Event, label: string) {
    this.chosenRange = label;

    if (label === this.locale.customRangeLabel) {
      this.isShown = true; // show calendars
      this.showCalInRanges = true;
    } else {
      const dates = this.ranges[label] as [Moment, Moment];

      this.startDate = dates[0].clone();
      this.endDate = dates[1].clone();

      if (this.showRangeLabelOnInput && label !== this.locale.customRangeLabel) {
        this.chosenLabel = label;
      } else {
        this.calculateChosenLabel();
      }

      this.showCalInRanges = !this.rangesArray.length || this.alwaysShowCalendars;

      if (!this.timePicker) {
        this.startDate.startOf('day');
        this.endDate.endOf('day');
      }

      if (!this.alwaysShowCalendars) {
        this.isShown = false; // hide calendars
      }

      this.rangeClicked.emit({ label, dates });

      if (!this.keepCalendarOpeningWithRange || this.autoApply) {
        this.clickApply();
      } else {
        if (!this.alwaysShowCalendars) {
          return this.clickApply();
        }

        if (this.maxDate && this.maxDate.isSame(dates[0], 'month')) {
          this.rightCalendar.month.month(dates[0].month());
          this.rightCalendar.month.year(dates[0].year());
          this.leftCalendar.month.month(dates[0].month() - 1);
          this.leftCalendar.month.year(dates[1].year());
        } else {
          this.leftCalendar.month.month(dates[0].month());
          this.leftCalendar.month.year(dates[0].year());
          // get the next year
          const nextMonth = dates[0].clone().add(1, 'month');

          this.rightCalendar.month.month(nextMonth.month());
          this.rightCalendar.month.year(nextMonth.year());
        }

        this.updateCalendars();

        if (this.timePicker) {
          this.renderTimePicker(SideEnum.left);
          this.renderTimePicker(SideEnum.right);
        }
      }
    }
  }

  show(_?: Event): void {
    if (this.isShown) {
      return;
    }

    this._old.start = this.startDate.clone();
    this._old.end = this.endDate.clone();
    this.isShown = true;
    this.updateView();
  }

  hide(_?: Event) {
    if (!this.isShown) {
      return;
    }

    // incomplete date selection, revert to last values
    if (!this.endDate) {
      if (this._old.start) {
        this.startDate = this._old.start.clone();
      }
      if (this._old.end) {
        this.endDate = this._old.end.clone();
      }
    }

    // if a new date range was selected, invoke the user callback function
    if (!this.startDate.isSame(this._old.start) || !this.endDate.isSame(this._old.end)) {
      // this.callback(this.startDate, this.endDate, this.chosenLabel);
    }

    // if picker is attached to a text input, update it
    this.updateElement();
    this.isShown = false;
    this._ref.detectChanges();
  }

  /**
   * handle click on all element in the component, useful for outside of click
   * @param e event
   */
  handleInternalClick(e: Event) {
    e.stopPropagation();
  }

  /**
   * update the locale options
   */
  updateLocale(locale: LocaleConfig) {
    for (const key in locale) {
      if (locale.hasOwnProperty(key)) {
        this.locale[key] = locale[key];

        if (key === 'customRangeLabel') {
          this.renderRanges();
        }
      }
    }
  }

  /**
   *  clear the daterange picker
   */
  clear() {
    this.startDate = moment().startOf('day');
    this.endDate = moment().endOf('day');
    this.selectedDate.emit({ chosenLabel: '', startDate: null, endDate: null });
    this.datesUpdated.emit({ startDate: null, endDate: null });
    this.hide();
  }

  /**
   * Find out if the selected range should be disabled if it doesn't
   * fit into minDate and maxDate limitations.
   */
  disableRange(range) {
    if (range === this.locale.customRangeLabel) {
      return false;
    }

    const rangeMarkers = this.ranges[range] as [Moment, Moment];
    const areBothBefore = rangeMarkers.every(date => {
      if (!this.minDate) {
        return false;
      }
      return date.isBefore(this.minDate);
    });

    const areBothAfter = rangeMarkers.every(date => {
      if (!this.maxDate) {
        return false;
      }
      return date.isAfter(this.maxDate);
    });

    return areBothBefore || areBothAfter;
  }

  /**
   * Find out if the current calendar row has current month days
   * (as opposed to consisting of only previous/next month days)
   */
  hasCurrentMonthDays(currentMonth, row) {
    for (let day = 0; day < 7; day++) {
      if (row[day].month() === currentMonth) {
        return true;
      }
    }
    return false;
  }

  /**
   * @param date the date to add time
   * @param side left or right
   */
  private _getDateWithTime(date, side: SideEnum): Moment {
    let hour = parseInt(this.timePickerVariables[side].selectedHour, 10);
    const compareHour = 12;

    if (!this.timePicker24Hour) {
      const ampm = this.timePickerVariables[side].ampmModel;
      if (ampm === 'PM' && hour < compareHour) {
        hour += compareHour;
      }
      if (ampm === 'AM' && hour === compareHour) {
        hour = 0;
      }
    }

    const minute = parseInt(this.timePickerVariables[side].selectedMinute, 10);
    const second = this.timePickerSeconds ? parseInt(this.timePickerVariables[side].selectedSecond, 10) : 0;

    return date
      .clone()
      .hour(hour)
      .minute(minute)
      .second(second);
  }
  /**
   *  build the locale config
   */
  private _buildLocale() {
    this.locale = { ...this._localeService.config, ...this.locale };

    if (!this.locale.format) {
      this.locale.format = this.timePicker
        ? moment.localeData().longDateFormat('lll')
        : moment.localeData().longDateFormat('L');
    }
  }

  private _buildCells(calendar, side: SideEnum) {
    for (let row = 0; row < 6; row++) {
      this.calendarVariables[side].classes[row] = {};

      const rowClasses = [];

      if (this.emptyWeekRowClass && !this.hasCurrentMonthDays(this.calendarVariables[side].month, calendar[row])) {
        rowClasses.push(this.emptyWeekRowClass);
      }

      for (let col = 0; col < 7; col++) {
        const classes = [];

        if (calendar[row][col].isSame(new Date(), 'day')) {
          // highlight today's date
          classes.push('today');
        }

        if (calendar[row][col].isoWeekday() > 5) {
          // highlight weekends
          classes.push('weekend');
        }

        // grey out the dates in other months displayed at beginning and end of this calendar
        if (calendar[row][col].month() !== calendar[1][1].month()) {
          classes.push('off');

          // mark the last day of the previous month in this calendar
          if (
            this.lastDayOfPreviousMonthClass &&
            (calendar[row][col].month() < calendar[1][1].month() || calendar[1][1].month() === 0) &&
            calendar[row][col].date() === this.calendarVariables[side].daysInLastMonth
          ) {
            classes.push(this.lastDayOfPreviousMonthClass);
          }

          // mark the first day of the next month in this calendar
          if (
            this.firstDayOfNextMonthClass &&
            (calendar[row][col].month() > calendar[1][1].month() || calendar[row][col].month() === 0) &&
            calendar[row][col].date() === 1
          ) {
            classes.push(this.firstDayOfNextMonthClass);
          }
        }

        // mark the first day of the current month with a custom class
        if (
          this.firstMonthDayClass &&
          calendar[row][col].month() === calendar[1][1].month() &&
          calendar[row][col].date() === calendar.firstDay.date()
        ) {
          classes.push(this.firstMonthDayClass);
        }

        // mark the last day of the current month with a custom class
        if (
          this.lastMonthDayClass &&
          calendar[row][col].month() === calendar[1][1].month() &&
          calendar[row][col].date() === calendar.lastDay.date()
        ) {
          classes.push(this.lastMonthDayClass);
        }

        // don't allow selection of dates before the minimum date
        if (this.minDate && calendar[row][col].isBefore(this.minDate, 'day')) {
          classes.push('off', 'disabled');
        }

        // don't allow selection of dates after the maximum date
        if (
          this.calendarVariables[side].maxDate &&
          calendar[row][col].isAfter(this.calendarVariables[side].maxDate, 'day')
        ) {
          classes.push('off', 'disabled');
        }

        // don't allow selection of date if a custom function decides it's invalid
        if (this.isInvalidDate(calendar[row][col])) {
          classes.push('off', 'disabled', 'invalid');
        }

        // highlight the currently selected start date
        if (this.startDate && calendar[row][col].format('YYYY-MM-DD') === this.startDate.format('YYYY-MM-DD')) {
          classes.push('active', 'start-date');
        }

        // highlight the currently selected end date
        if (this.endDate != null && calendar[row][col].format('YYYY-MM-DD') === this.endDate.format('YYYY-MM-DD')) {
          classes.push('active', 'end-date');
        }

        // highlight dates in-between the selected dates
        if (
          ((this.nowHoveredDate != null && this.pickingDate) || this.endDate != null) &&
          calendar[row][col] > this.startDate &&
          (calendar[row][col] < this.endDate || (calendar[row][col] < this.nowHoveredDate && this.pickingDate)) &&
          !classes.find(el => el === 'off')
        ) {
          classes.push('in-range');
        }

        // apply custom classes for this date
        const isCustom = this.isCustomDate(calendar[row][col]);

        if (isCustom !== false) {
          if (typeof isCustom === 'string') {
            classes.push(isCustom);
          } else {
            Array.prototype.push.apply(classes, isCustom);
          }
        }

        // apply custom tooltip for this date
        const isTooltip = this.addTooltipForDate(calendar[row][col]);

        this.toolTipText[calendar[row][col]] = isTooltip
          ? typeof isTooltip === 'string'
            ? isTooltip
            : 'Put the tooltip as the returned value of addTooltipForDate'
          : '';

        // store classes var
        let cname = '';
        let disabled = false;

        for (const iterator of classes) {
          cname += iterator + ' ';
          if (iterator === 'disabled') {
            disabled = true;
          }
        }

        if (!disabled) {
          cname += 'available';
        }
        this.calendarVariables[side].classes[row][col] = cname.replace(/^\s+|\s+$/g, '');
      }
      this.calendarVariables[side].classes[row].classList = rowClasses.join(' ');
    }
  }
}
