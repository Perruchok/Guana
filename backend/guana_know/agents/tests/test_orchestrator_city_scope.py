from agents import orchestrator


def test_target_city_with_country_suffix_is_local():
    assert orchestrator._is_target_city_name('Guanajuato City, Mexico') is True


def test_non_target_city_with_country_suffix_is_non_local():
    assert orchestrator._is_non_target_city_name('León, Mexico') is True


def test_target_location_city_wins_over_non_target_text_mentions():
    event_data = {
        'title': 'Danza-Teatro: Espejos de Agua',
        'location_city': 'Guanajuato City, Mexico',
        'venue_name': 'Teatro Cervantes',
        'description': 'También hay otra función en Purísima del Rincón en otra fecha.',
    }

    decision, reason, used_llm = orchestrator._assess_city_scope(event_data, 'https://example.com')

    assert decision == 'local'
    assert reason == 'location_city_is_target'
    assert used_llm is False


def test_map_apify_event_uses_nested_location_fields():
    raw_item = {
        'name': 'Concierto Comunitario: México y el Mundo',
        'description': 'Evento cultural en el Teatro del Bicentenario.',
        'utcStartDate': '2026-07-04T01:00:00.000Z',
        'location': {
            'name': 'Teatro del Bicentenario',
            'city': 'Guanajuato City, Mexico',
        },
        'imageUrl': 'https://example.com/image.jpg',
        'url': 'https://facebook.com/events/123',
        'paidContent': False,
    }

    mapped = orchestrator._map_apify_facebook_event(raw_item)

    assert mapped['title'] == 'Concierto Comunitario: México y el Mundo'
    assert mapped['venue_name'] == 'Teatro del Bicentenario'
    assert mapped['location_city'] == 'Guanajuato City, Mexico'
    assert mapped['start_datetime'] == '2026-07-04T01:00:00.000Z'
    assert mapped['registration_url'] == 'https://facebook.com/events/123'
    assert mapped['image_url'] == 'https://example.com/image.jpg'
    assert mapped['is_free'] is True


def test_map_apify_event_falls_back_to_flat_location_fields():
    raw_item = {
        'name': 'Ciclo de cine esotérico',
        'details': 'Proyección especial.',
        'utcStartDate': '2026-06-27T19:30:00.000Z',
        'location.name': 'Museo de Arte e Historia de Guanajuato',
        'location.city': 'León, Mexico',
        'paidContent': True,
    }

    mapped = orchestrator._map_apify_facebook_event(raw_item)

    assert mapped['venue_name'] == 'Museo de Arte e Historia de Guanajuato'
    assert mapped['location_city'] == 'León, Mexico'
    assert mapped['is_free'] is False
    assert mapped['description'] == 'Proyección especial.'


def test_venue_with_target_city_is_local_when_city_missing():
    event_data = {
        'title': 'Presentación especial',
        'location_city': None,
        'venue_name': 'Centro Cultural Guanajuato',
        'description': 'Actividad abierta al público.',
    }

    decision, reason, used_llm = orchestrator._assess_city_scope(event_data, 'https://example.com')

    assert decision == 'local'
    assert reason == 'venue_mentions_target_city'
    assert used_llm is False


def test_venue_with_non_target_city_is_non_local_when_city_missing():
    event_data = {
        'title': 'Función itinerante',
        'location_city': None,
        'venue_name': 'Teatro de la Ciudad de Purísima del Rincón',
        'description': 'Una sola función.',
    }

    decision, reason, used_llm = orchestrator._assess_city_scope(event_data, 'https://example.com')

    assert decision == 'non_local'
    assert reason == 'venue_mentions_non_target_city'
    assert used_llm is False