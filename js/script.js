/*
 * Atelier Endterm — exhibition table (Create, Read, Update, Delete).
 * jQuery loads before this file. Each page may load this script: the first
 * check below makes the table code run only on the Exhibitions page.
 * Gallery interactions are in gallery.js; form validation is in forms.js.
 */
$(function () {
    "use strict";

    if (!$("#exhibition-table").length) {
        return;
    }

    const storageKey = "atelier-exhibitions-v1";
    const artworkIds = ["quiet-sun", "blue-hour", "still-life", "warm-earth", "garden-notes", "coastal-lines"];
    const $form = $("#exhibition-form");
    const $body = $("#exhibition-rows");
    let editingId = null;

    // A function returns a fresh array so Reset never reuses edited objects.
    function sampleExhibitions() {
        return [
            { id: "earth-sky", title: "Between earth & sky", theme: "Landscapes", works: "Quiet Sun, Coastal Lines", artwork: "quiet-sun" },
            { id: "shape-silence", title: "The shape of silence", theme: "Abstract forms", works: "Blue Hour, Warm Earth", artwork: "blue-hour" },
            { id: "ordinary-wonders", title: "Ordinary wonders", theme: "Nature & still life", works: "Sunday Still Life, Garden Notes", artwork: "still-life" }
        ];
    }

    // localStorage holds only exhibition text, never registration details.
    // It can be disabled or full, so storage problems must not break CRUD.
    function showStorageWarning(message) {
        $("#storage-warning").text(message).prop("hidden", false);
    }

    function validRecord(item) {
        return item && typeof item.id === "string" && item.id.length > 0 && item.id.length <= 100 &&
            typeof item.title === "string" && item.title.trim().length >= 2 && item.title.length <= 80 &&
            typeof item.theme === "string" && item.theme.trim().length >= 2 && item.theme.length <= 60 &&
            typeof item.works === "string" && item.works.trim().length >= 2 && item.works.length <= 160 &&
            artworkIds.includes(item.artwork);
    }

    function loadExhibitions() {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored === null) {
                return sampleExhibitions();
            }
            const records = JSON.parse(stored);
            if (!Array.isArray(records) || records.length > 200 || !records.every(validRecord) ||
                new Set(records.map(function (item) { return item.id; })).size !== records.length) {
                throw new Error("Invalid saved exhibition data");
            }
            return records;
        } catch (error) {
            showStorageWarning("Saved exhibitions could not be loaded. Sample records are shown. You can still edit this table.");
            return sampleExhibitions();
        }
    }

    let exhibitions = loadExhibitions();

    function saveExhibitions() {
        try {
            localStorage.setItem(storageKey, JSON.stringify(exhibitions));
            $("#storage-warning").prop("hidden", true);
        } catch (error) {
            showStorageWarning("Browser storage is unavailable or full. Changes work in this tab but may be lost when you reload.");
        }
    }

    function announce(message) {
        $("#exhibition-status").text(message);
    }

    // READ: build the table from the array. .text() keeps entered HTML as text.
    function renderExhibitions() {
        $body.empty();
        exhibitions.forEach(function (exhibition) {
            const $row = $("<tr>");
            $("<th>", { scope: "row" }).text(exhibition.title).appendTo($row);
            $("<td>").text(exhibition.theme).appendTo($row);
            $("<td>").text(exhibition.works).appendTo($row);
            const $explore = $("<td>").appendTo($row);
            $("<a>", { href: "gallery.html#" + exhibition.artwork }).text("View works ↗").appendTo($explore);
            const $actions = $("<td>", { class: "table-actions" }).appendTo($row);
            $("<button>", { type: "button", class: "table-button edit-exhibition" })
                .attr("data-id", exhibition.id).attr("aria-label", "Edit " + exhibition.title).text("Edit").appendTo($actions);
            $("<button>", { type: "button", class: "table-button delete-exhibition" })
                .attr("data-id", exhibition.id).attr("aria-label", "Delete " + exhibition.title).text("Delete").appendTo($actions);
            $body.append($row);
        });
        if (exhibitions.length === 0) {
            $("<tr>").append($("<td>", { colspan: 5, class: "empty-table" })
                .text("No exhibitions yet. Add your first exhibition using the form above.")).appendTo($body);
        }
        $("#exhibition-count").text(exhibitions.length + (exhibitions.length === 1 ? " exhibition" : " exhibitions"));
    }

    const fieldRules = {
        "exhibition-title": { label: "Exhibition name", min: 2, max: 80 },
        "exhibition-theme": { label: "Theme", min: 2, max: 60 },
        "exhibition-works": { label: "Featured works", min: 2, max: 160 }
    };

    function validateField(id) {
        const $field = $("#" + id);
        const rule = fieldRules[id];
        const value = $field.val().trim();
        let message = "";
        if (value.length < rule.min) {
            message = rule.label + " must contain at least " + rule.min + " characters.";
        } else if (value.length > rule.max) {
            message = rule.label + " must contain at most " + rule.max + " characters.";
        }
        $field.attr("aria-invalid", String(Boolean(message))).toggleClass("is-invalid", Boolean(message));
        $("#" + id + "-feedback").text(message);
        return !message;
    }

    // Both adding and editing use the same form. Reset returns to Add mode.
    function resetEditor() {
        editingId = null;
        $form[0].reset();
        $form.find(".is-invalid").removeClass("is-invalid");
        $form.find("[aria-invalid]").removeAttr("aria-invalid");
        $form.find(".field-feedback").text("");
        $("#editor-heading").text("Add an exhibition");
        $("#save-exhibition").text("Add exhibition");
        $("#cancel-edit").prop("hidden", true);
    }

    $form.on("input blur", "input", function () {
        validateField(this.id);
    });

    // CREATE and UPDATE: validate first, change the array, save, then redraw.
    $form.on("submit", function (event) {
        event.preventDefault();
        let firstInvalid = null;
        Object.keys(fieldRules).forEach(function (id) {
            if (!validateField(id) && !firstInvalid) {
                firstInvalid = id;
            }
        });
        if (firstInvalid) {
            announce("Check the highlighted fields before saving.");
            $("#" + firstInvalid).trigger("focus");
            return;
        }
        if (!editingId && exhibitions.length >= 200) {
            announce("This demo supports 200 exhibitions. Delete a record before adding another.");
            return;
        }
        const exhibition = {
            id: editingId || "exhibition-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
            title: $("#exhibition-title").val().trim(),
            theme: $("#exhibition-theme").val().trim(),
            works: $("#exhibition-works").val().trim(),
            artwork: $("#exhibition-artwork").val()
        };
        const wasEditing = Boolean(editingId);
        if (wasEditing) {
            exhibitions = exhibitions.map(function (item) {
                return item.id === editingId ? exhibition : item;
            });
        } else {
            exhibitions.push(exhibition);
        }
        saveExhibitions();
        renderExhibitions();
        resetEditor();
        announce('“' + exhibition.title + '” ' + (wasEditing ? "updated." : "added."));
        $("#exhibition-title").trigger("focus");
    });

    // Delegation also handles buttons created after the page first loads.
    $body.on("click", ".edit-exhibition", function () {
        const recordId = $(this).attr("data-id");
        const exhibition = exhibitions.find(function (item) { return item.id === recordId; });
        if (!exhibition) { return; }
        resetEditor();
        editingId = exhibition.id;
        $("#exhibition-title").val(exhibition.title);
        $("#exhibition-theme").val(exhibition.theme);
        $("#exhibition-works").val(exhibition.works);
        $("#exhibition-artwork").val(exhibition.artwork);
        $("#editor-heading").text("Edit an exhibition");
        $("#save-exhibition").text("Save changes");
        $("#cancel-edit").prop("hidden", false);
        announce('Editing “' + exhibition.title + '”. Save your changes or cancel.');
        $("#exhibition-title").trigger("focus");
    });

    // DELETE: a cancelled confirmation does not change the array or storage.
    $body.on("click", ".delete-exhibition", function () {
        const recordId = $(this).attr("data-id");
        const exhibition = exhibitions.find(function (item) { return item.id === recordId; });
        if (!exhibition || !window.confirm('Delete “' + exhibition.title + '”? This removes it from your exhibition guide.')) {
            return;
        }
        exhibitions = exhibitions.filter(function (item) { return item.id !== recordId; });
        if (editingId === recordId) { resetEditor(); }
        saveExhibitions();
        renderExhibitions();
        announce('“' + exhibition.title + '” deleted.');
        $("#exhibition-title").trigger("focus");
    });

    $("#cancel-edit").on("click", function () {
        resetEditor();
        announce("Edit cancelled. The record has not changed.");
        $("#exhibition-title").trigger("focus");
    });

    $("#reset-exhibitions").on("click", function () {
        if (!window.confirm("Replace your exhibition guide with the three sample exhibitions? Your custom records will be removed.")) {
            return;
        }
        exhibitions = sampleExhibitions();
        saveExhibitions();
        resetEditor();
        renderExhibitions();
        announce("The three sample exhibitions have been restored.");
    });

    $("#exhibition-tools, .crud-only").prop("hidden", false);
    renderExhibitions();
});
