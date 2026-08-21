-- V32.61 Dragonbound furniture starter gifts
update public.dragonbound_furniture_catalog set price=250, updated_at=now() where item_id='bed-0';
update public.dragonbound_furniture_catalog set price=430, updated_at=now() where item_id='bath-0';
update public.dragonbound_furniture_catalog set price=675, updated_at=now() where item_id='toy-1';
update public.dragonbound_furniture_catalog set price=0, updated_at=now() where item_id in ('starter-01-round-dragon-nest-bed','starter-07-baby-dragon-bath-tub','starter-18-stuffed-wyvern-toy');
