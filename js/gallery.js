/* Gallery: combine a search term and category, then browse matching artworks. */
$(function () {
    "use strict";

    const $cards = $("#artwork-grid .art-card");
    if (!$cards.length) return;

    const $search = $("#gallery-search");
    const $filters = $(".filter-button");
    const $lightbox = $("#art-lightbox");
    const $image = $("#lightbox-image");
    const $close = $("#lightbox-close");
    const $previous = $("#lightbox-prev");
    const $next = $("#lightbox-next");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let category = "all";
    let visibleCards = $cards.toArray();
    let currentIndex = 0;
    let opener = null;
    let isOpen = false;
    let backgroundState = [];

    // Hidden controls are revealed only after their event handlers are available.
    $("#gallery-controls").prop("hidden", false);

    function filterArtworks() {
        const query = $search.val().trim().toLowerCase();
        visibleCards = [];

        $cards.each(function () {
            const $card = $(this);
            const cardCategory = $card.attr("data-category");
            const searchableText = [
                $card.attr("data-title"),
                $card.attr("data-artist"),
                cardCategory
            ].join(" ").toLowerCase();
            const matchesSearch = searchableText.includes(query);
            const matchesCategory = category === "all" || cardCategory === category;
            const matches = matchesSearch && matchesCategory;

            $card.prop("hidden", !matches);
            if (matches) visibleCards.push(this);
        });

        $("#gallery-result-count").text("Showing " + visibleCards.length + " of " + $cards.length + " artworks.");
        $("#gallery-empty").prop("hidden", visibleCards.length !== 0);
    }

    // The input event covers typing, pasting, and a search field's clear button.
    $search.on("input", filterArtworks);

    $filters.on("click", function () {
        category = $(this).attr("data-category");
        $filters.removeClass("active").attr("aria-pressed", "false");
        $(this).addClass("active").attr("aria-pressed", "true");
        filterArtworks();
    });

    $("#clear-gallery").on("click", function () {
        $search.val("");
        category = "all";
        $filters.removeClass("active").attr("aria-pressed", "false");
        $filters.filter('[data-category="all"]').addClass("active").attr("aria-pressed", "true");
        filterArtworks();
        $search.trigger("focus");
    });

    function fillLightbox() {
        const $card = $(visibleCards[currentIndex]);
        const $thumbnail = $card.find("img");

        // .attr() and .text() set values safely instead of interpreting HTML.
        $image.attr({ src: $thumbnail.attr("src"), alt: $thumbnail.attr("alt") });
        $("#lightbox-title").text($card.attr("data-title"));
        $("#lightbox-details").text($card.attr("data-artist") + " · " + $card.find(".art-type").text() + " · 2026");
        $("#lightbox-counter").text((currentIndex + 1) + " of " + visibleCards.length);
        $previous.add($next).prop("disabled", visibleCards.length < 2);
    }

    function openLightbox(card, trigger) {
        currentIndex = visibleCards.indexOf(card);
        if (currentIndex < 0) return;

        opener = trigger;
        isOpen = true;
        fillLightbox();

        // Prevent keyboard and screen-reader focus from reaching the background.
        backgroundState = $("body > header, body > main, body > footer").toArray().map(function (element) {
            const wasInert = element.inert;
            element.inert = true;
            return { element: element, wasInert: wasInert };
        });
        $("body").addClass("lightbox-open");
        $lightbox.prop("hidden", false).stop(true, true).fadeIn(reducedMotion.matches ? 0 : 180);
        $close.trigger("focus");
    }

    function closeLightbox() {
        if (!isOpen) return;
        isOpen = false;
        $image.stop(true, true).show();

        $lightbox.stop(true, true).fadeOut(reducedMotion.matches ? 0 : 180, function () {
            $lightbox.prop("hidden", true);
            $("body").removeClass("lightbox-open");
            backgroundState.forEach(function (item) {
                item.element.inert = item.wasInert;
            });
            if (opener && document.contains(opener)) opener.focus();
        });
    }

    function moveLightbox(direction) {
        if (!isOpen || visibleCards.length < 2) return;

        // Stop an unfinished transition before accepting another arrow press.
        $image.stop(true, true);
        currentIndex = (currentIndex + direction + visibleCards.length) % visibleCards.length;
        $image.fadeOut(reducedMotion.matches ? 0 : 100, function () {
            fillLightbox();
            $image.fadeIn(reducedMotion.matches ? 0 : 140);
        });
    }

    $(".lightbox-trigger").on("click", function (event) {
        event.preventDefault();
        openLightbox($(this).closest(".art-card")[0], this);
    });

    $close.on("click", closeLightbox);
    $previous.on("click", function () { moveLightbox(-1); });
    $next.on("click", function () { moveLightbox(1); });

    // A click on the backdrop closes the viewer; clicks inside its panel do not.
    $lightbox.on("click", function (event) {
        if (event.target === this) closeLightbox();
    });

    $(document).on("keydown.gallery", function (event) {
        if (!isOpen) return;

        if (event.key === "Escape") {
            event.preventDefault();
            closeLightbox();
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            moveLightbox(-1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            moveLightbox(1);
        } else if (event.key === "Tab") {
            const $buttons = $lightbox.find("button:enabled");
            const first = $buttons[0];
            const last = $buttons[$buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    filterArtworks();
});
