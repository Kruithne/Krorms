$(function()
{
	var krorms =
	{
		months: [
			'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
		],
		errors: [],
		isFunction: function(functionName)
		{
			return typeof functionName === 'function';
		},

		load: function()
		{
			$(document).on('submit', '.validatable', function(event)
			{
				var form = $(this);

				var submitFunction = window[form.attr('submit')];
				if (submitFunction != undefined && krorms.isFunction(submitFunction))
					submitFunction(form);

				if (krorms.validate(form))
				{
					// Check if we have a completion function and provoke it.
					var completeFunction = window[form.attr('complete')];
					if (completeFunction != undefined && krorms.isFunction(completeFunction))
						completeFunction(form);

					// Prevent the default form behavior if specified.
					if (form.hasClass('preventDefault'))
						event.preventDefault();
				}
				else
				{
					event.preventDefault();
					var errorFunction = window[form.attr('error')];
					if (errorFunction != undefined && krorms.isFunction(errorFunction))
						errorFunction(krorms.errors);
				}
			});

			$.fn.extend({
				updateSelectorDays: function()
				{
					var holder = this.parent(),
						oldValue = this.val(),
						newValue = 1,
						monthSelector = holder.children('[type=month]').first(),
						yearSelector = holder.children('[type=year]').first(),
						days = new Date(yearSelector.val(), monthSelector.val(), 0).getDate(),
						currentIndex = 1;

					this.empty(); // Remove all existing values.
					while (currentIndex < days + 1)
					{
						$('<option/>').val(currentIndex).html(currentIndex).appendTo(this);
						if (oldValue != null && currentIndex > newValue && currentIndex <= oldValue)
							newValue = currentIndex;

						currentIndex++;
					}
					this.val(newValue);
				},
				getDateSelectorValue: function()
				{
					var t = this, h = krorms;
					return h.getSelectorValue(t, 'year') + '-' + h.getSelectorValue(t, 'month') + '-' + h.getSelectorValue(t, 'day');
				},
				updateRange: function()
				{
					var range = this.attr('range');

					if (range != undefined)
					{
						// Populate the selector with all the months.
						if (range == 'months')
						{
							for (var monthIndex in krorms.months)
								$('<option/>').val(parseInt(monthIndex) + 1).html(krorms.months[monthIndex]).appendTo(this);
							return;
						}

						// Populate the selector with days and keep them updated correctly.
						if (range == 'days')
						{
							var holder = this.parent(), element = this;

							var func = function()
							{
								element.updateSelectorDays();
							};

							holder.children('[type=month]').first().on('change', func);
							holder.children('[type=year]').first().on('change', func);

							return;
						}

						var rangeSplit = range.split('-', 2),
							lower = krorms.parseRangeValue(rangeSplit[0]),
							higher = krorms.parseRangeValue(rangeSplit[1]);

						var i = lower;
						if (lower > higher)
						{
							while (i > higher - 1)
							{
								$('<option/>').val(i).html(i).appendTo(this);
								i--;
							}
						}
						else
						{
							while (i < higher + 1)
							{
								$('<option/>').val(i).html(i).appendTo(this);
								i++;
							}
						}

						if (this.attr('type') == 'year')
							this.parent().children('[type=day]').updateSelectorDays();
					}
				},
				setDateSelectorValue: function(v)
				{
					var t = $(this), d = value instanceof Date ? [v.getFullYear(), v.getMonth(), v.getDate()] : value.split('-');

					krorms.setSelectorValue(t, 'month', d[1]);
					krorms.setSelectorValue(t, 'year', d[0]);
					krorms.setSelectorValue(t, 'day', d[2]);
				}
			});

			// Automatically run updateRange on any select elements already around.
			$('select').each(function()
			{
				$(this).updateRange();
			});

			$('.dateSelector').each(function()
			{
				var t = $(this), d = t.attr('date');

				if (d != undefined)
				{
					if (d == 'now')
						d = new Date();

					t.setDateSelectorValue(d);
				}
			});
		},

		setSelectorValue: function(element, type, value)
		{
			element.find('select[type="' + type + '"]').val(parseInt(value));
		},

		getSelectorValue: function(element, type)
		{
			return element.children('[type=' + type + ']').val();
		},

		parseRangeValue: function(valueString)
		{
			valueString = valueString.replace('year', new Date().getFullYear());
			return parseInt(eval(valueString));
		},

		validate: function(form)
		{
			krorms.errors = [];

			// Loop through each field and validate it.
			form.find('input,textarea,.dateSelector').each(function()
			{
				var field = $(this);
				if (field.hasClass('dateSelector'))
					krorms.validateDateField(field);
				else
					krorms.validateField(field);
			});

			return Object.size(krorms.errors) == 0;
		},

		validateDateField: function(field)
		{
			var value = field.getDateSelectorValue().split('-'),
				validate = field.attr('validate');

			if (validate !== undefined)
			{
				var date = new Date(value[0], value[1] - 1, value[2]).getTime(),
					now = new Date(),
					today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

				console.info(date);
				console.info(today);

				if (validate.indexOf('=') > -1 && date == today)
					return;

				if (validate.indexOf('>') > -1 && date > today)
					return;

				if (validate.indexOf('<') > -1 && date < today)
					return;

				krorms.error(field, 'invalid_date');
			}
		},

		validateField: function(field)
		{
			var minLength = field.attr('minlength'),
				maxLength = field.attr('maxlength'),
				fieldValue = field.val().trim(),
				valueLength = fieldValue.length,
				required = krorms.isRequired(field);

			if (valueLength == 0)
			{
				if (required)
					krorms.error(field, 'required'); // If field is required and it's empty, that's a paddling!
				else
					return; // If we're empty and not required, just skip validation.
			}

			if (minLength != undefined && maxLength != undefined && (valueLength < minLength || valueLength > maxLength))
			{
				krorms.error(field, 'both_length');
			}
			else
			{
				if (minLength != undefined && valueLength < minLength)
					krorms.error(field, 'min_length');

				if (maxLength != undefined && valueLength > maxLength)
					krorms.error(field, 'max_length');
			}

			var validateType = field.attr('validate');
			if (validateType != undefined)
			{
				if (validateType == 'email')
				{
					if (fieldValue.match(/^\S+@\S+\.[a-zA-Z]+$/) == null)
						krorms.error(field, 'invalid_email');
				}
				else if (validateType == 'number')
				{
					if (fieldValue.match(/^[\d]+$/) == null)
						krorms.error(field, 'invalid_number');
				}
				else
				{
					if (fieldValue.match(new RegExp(validateType)) == null)
						krorms.error(field, 'invalid');
				}
			}
		},

		isRequired: function(field)
		{
			if (!field instanceof jQuery)
				field = $(field);

			var requiredValue = field.attr('require');
			return requiredValue !== undefined || requiredValue == 'true';
		},

		error: function(field, error)
		{
			krorms.errors.push({
				field: field,
				error: error
			});
		}
	};
	krorms.load();
})

if (Object.size == undefined)
{
	Object.size = function(obj)
	{
		var size = 0, key;
		for (key in obj)
			if (obj.hasOwnProperty(key)) size++;

		return size;
	};
}