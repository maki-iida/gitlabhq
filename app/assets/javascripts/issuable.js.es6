(function() {
  var issuable_created;

  issuable_created = false;

  this.Issuable = {
    init: function() {
      Issuable.initTemplates();
      Issuable.initSearch();
      Issuable.initChecks();
      Issuable.initResetFilters();
      return Issuable.initLabelFilterRemove();
    },
    initTemplates: function() {
      return Issuable.labelRow = _.template('<% _.each(labels, function(label){ %> <span class="label-row btn-group" role="group" aria-label="<%- label.title %>" style="color: <%- label.text_color %>;"> <a href="#" class="btn btn-transparent has-tooltip" style="background-color: <%- label.color %>;" title="<%- label.description %>" data-container="body"> <%- label.title %> </a> <button type="button" class="btn btn-transparent label-remove js-label-filter-remove" style="background-color: <%- label.color %>;" data-label="<%- label.title %>"> <i class="fa fa-times"></i> </button> </span> <% }); %>');
    },
    initSearch: function() {
      // `immediate` param set to false debounces on the `trailing` edge, lets user finish typing
      const debouncedExecSearch = _.debounce(Issuable.executeSearch, 500, false);

      $('#issuable_search').off('keyup').on('keyup', debouncedExecSearch);

      // ensures existing filters are preserved when manually submitted
      $('#issue_search_form').on('submit', (e) => {
        e.preventDefault();
        debouncedExecSearch(e);
      });
    },
    executeSearch: function(e) {
      const $search = $('#issuable_search');
      const $searchName = $search.attr('name');
      const $searchValue = $search.val();
      const $filtersForm = $('.js-filter-form');
      const $input = $(`input[name='${$searchName}']`, $filtersForm);

      if (!$input.length) {
        $filtersForm.append(`<input type='hidden' name='${$searchName}' value='${_.escape($searchValue)}'/>`);
      } else {
        $input.val($searchValue);
      }

      Issuable.filterResults($filtersForm);
    },
    initLabelFilterRemove: function() {
      return $(document).off('click', '.js-label-filter-remove').on('click', '.js-label-filter-remove', function(e) {
        var $button;
        $button = $(this);
        // Remove the label input box
        $('input[name="label_name[]"]').filter(function() {
          return this.value === $button.data('label');
        }).remove();
        // Submit the form to get new data
        Issuable.filterResults($('.filter-form'));
      });
    },
    filterResults: (function(_this) {
      return function(form) {
        var formAction, formData, issuesUrl;
        formData = form.serialize();
        formAction = form.attr('action');
        issuesUrl = formAction;
        issuesUrl += "" + (formAction.indexOf('?') < 0 ? '?' : '&');
        issuesUrl += formData;
        return Turbolinks.visit(issuesUrl);
      };
    })(this),
    initResetFilters: function() {
      $('.reset-filters').on('click', function(e) {
        e.preventDefault();
        const target = e.target;
        const $form = $(target).parents('.js-filter-form');
        const baseIssuesUrl = target.href;

        $form.attr('action', baseIssuesUrl);
        Turbolinks.visit(baseIssuesUrl);
      });
    },
    initChecks: function() {
      this.issuableBulkActions = $('.bulk-update').data('bulkActions');
      $('.check_all_issues').off('click').on('click', function() {
        $('.selected_issue').prop('checked', this.checked);
        return Issuable.checkChanged();
      });
      return $('.selected_issue').off('change').on('change', Issuable.checkChanged.bind(this));
    },
    checkChanged: function() {
      const $checkedIssues = $('.selected_issue:checked');
      const $updateIssuesIds = $('#update_issuable_ids');
      const $issuesOtherFilters = $('.issues-other-filters');
      const $issuesBulkUpdate = $('.issues_bulk_update');

      if ($checkedIssues.length > 0) {
        let ids = $.map($checkedIssues, function(value) {
          return $(value).data('id');
        });
        $updateIssuesIds.val(ids);
        $issuesOtherFilters.hide();
        $issuesBulkUpdate.show();
      } else {
        $updateIssuesIds.val([]);
        $issuesBulkUpdate.hide();
        $issuesOtherFilters.show();
        this.issuableBulkActions.willUpdateLabels = false;
      }
      return true;
    }
  };

}).call(this);
