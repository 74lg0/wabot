#!/bin/python3
import sys

def numero(numero_telefono):
    try:
        import phonenumbers
        from phonenumbers import geocoder, carrier, timezone

        telefono = phonenumbers.parse(numero_telefono)
        international = phonenumbers.format_number(telefono, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
        codigo_pais = international.split(' ')[0]
        country = geocoder.country_name_for_number(telefono, 'en')
        localizacion = geocoder.description_for_number(telefono, 'en')
        carrierr = carrier.name_for_number(telefono, 'en')
        zonas = list(timezone.time_zones_for_number(telefono))

        print(f'📞 *Número escaneado*')
        print(f'━━━━━━━━━━━━━━━━━━━━')
        print(f'▸ Internacional : {international}')
        print(f'▸ País          : {country} ({codigo_pais})')
        print(f'▸ Ciudad        : {localizacion}')
        print(f'▸ Operador      : {carrierr}')
        print(f'▸ Zona horaria  : {", ".join(zonas)}')
        print(f'━━━━━━━━━━━━━━━━━━━━')
        print(f'✅ Escaneo completo.')

    except ImportError:
        print("❌ Módulo *phonenumbers* no encontrado.\nEjecuta: pip3 install phonenumbers")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ No se proporcionó número.")
        sys.exit(1)
    numero(sys.argv[1])